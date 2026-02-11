import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { calculateCommission } from '@collabify/shared';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY', ''), {
      apiVersion: '2024-11-20.acacia' as any,
    });
  }

  // Step 1: Authorize payment (escrow hold)
  async createPaymentIntent(contractId: string, brandId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { campaign: { include: { brand: true } } },
    });
    if (!contract) throw new NotFoundException('Contract not found');
    if (contract.brandId !== brandId) throw new BadRequestException('Not your contract');

    // Check no existing pending/authorized payment
    const existing = await this.prisma.paymentIntentRecord.findFirst({
      where: { contractId, status: { in: ['PENDING', 'AUTHORIZED'] } },
    });
    if (existing) throw new BadRequestException('Payment already initiated');

    const { commission, payout } = calculateCommission(contract.priceInCents, contract.commissionRate);

    try {
      // Create Stripe PaymentIntent with manual capture (escrow-like)
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: contract.priceInCents,
        currency: 'usd',
        capture_method: 'manual', // Hold, don't capture yet
        metadata: {
          contractId,
          brandId,
          creatorId: contract.creatorId,
          commission: commission.toString(),
        },
      });

      // Record in our ledger
      const record = await this.prisma.$transaction(async (tx) => {
        const pi = await tx.paymentIntentRecord.create({
          data: {
            contractId,
            brandId,
            stripePaymentId: paymentIntent.id,
            amountInCents: contract.priceInCents,
            commissionCents: commission,
            creatorPayoutCents: payout,
            status: 'PENDING',
          },
        });

        await tx.ledgerEntry.create({
          data: {
            contractId,
            type: 'ESCROW_HOLD',
            amountInCents: contract.priceInCents,
            description: `Escrow hold for contract ${contractId}`,
            metadata: { stripePaymentIntentId: paymentIntent.id },
          },
        });

        return pi;
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        record,
      };
    } catch (error: any) {
      this.logger.error('Stripe payment intent creation failed', error);
      throw new BadRequestException('Payment creation failed: ' + error.message);
    }
  }

  // Step 2: Capture payment (after deliverables approved)
  async capturePayment(contractId: string) {
    const record = await this.prisma.paymentIntentRecord.findFirst({
      where: { contractId, status: 'AUTHORIZED' },
    });
    if (!record || !record.stripePaymentId) {
      throw new NotFoundException('No authorized payment found');
    }

    try {
      await this.stripe.paymentIntents.capture(record.stripePaymentId);

      await this.prisma.$transaction(async (tx) => {
        await tx.paymentIntentRecord.update({
          where: { id: record.id },
          data: { status: 'CAPTURED', capturedAt: new Date() },
        });

        await tx.ledgerEntry.create({
          data: {
            contractId,
            type: 'ESCROW_CAPTURE',
            amountInCents: record.amountInCents,
            description: `Payment captured for contract ${contractId}`,
          },
        });
      });

      return { success: true };
    } catch (error: any) {
      this.logger.error('Stripe capture failed', error);
      throw new BadRequestException('Capture failed');
    }
  }

  // Step 3: Release funds to creator
  async releaseToCeator(contractId: string) {
    const record = await this.prisma.paymentIntentRecord.findFirst({
      where: { contractId, status: 'CAPTURED' },
    });
    if (!record) throw new NotFoundException('No captured payment found');

    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract || contract.status !== 'COMPLETED') {
      throw new BadRequestException('Contract must be completed to release funds');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.paymentIntentRecord.update({
        where: { id: record.id },
        data: { status: 'RELEASED', releasedAt: new Date() },
      });

      // Platform commission entry
      await tx.ledgerEntry.create({
        data: {
          contractId,
          type: 'PLATFORM_COMMISSION',
          amountInCents: record.commissionCents,
          description: `Platform commission (${contract.commissionRate * 100}%)`,
        },
      });

      // Creator payout entry
      await tx.ledgerEntry.create({
        data: {
          contractId,
          type: 'CREATOR_PAYOUT',
          amountInCents: record.creatorPayoutCents,
          description: `Creator payout for contract ${contractId}`,
        },
      });

      // Create payout record
      await tx.payoutRecord.create({
        data: {
          creatorId: contract.creatorId,
          amountInCents: record.creatorPayoutCents,
          status: 'pending',
        },
      });
    });

    return { success: true, payout: record.creatorPayoutCents };
  }

  // Webhook handler
  async handleWebhook(signature: string, rawBody: Buffer) {
    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET', '');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      this.logger.error('Webhook signature verification failed', err);
      throw new BadRequestException('Webhook error');
    }

    switch (event.type) {
      case 'payment_intent.amount_capturable_updated': {
        // Payment authorized / funds held
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.prisma.paymentIntentRecord.updateMany({
          where: { stripePaymentId: pi.id },
          data: { status: 'AUTHORIZED' },
        });
        break;
      }
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.prisma.paymentIntentRecord.updateMany({
          where: { stripePaymentId: pi.id },
          data: { status: 'CAPTURED', capturedAt: new Date() },
        });
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.prisma.paymentIntentRecord.updateMany({
          where: { stripePaymentId: pi.id },
          data: { status: 'FAILED' },
        });
        break;
      }
    }

    return { received: true };
  }

  // Ledger queries
  async getLedger(contractId: string) {
    return this.prisma.ledgerEntry.findMany({
      where: { contractId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCreatorPayouts(creatorUserId: string) {
    const creator = await this.prisma.creatorProfile.findUnique({ where: { userId: creatorUserId } });
    if (!creator) throw new NotFoundException();

    return this.prisma.payoutRecord.findMany({
      where: { creatorId: creator.id },
      orderBy: { createdAt: 'desc' },
    });
  }
}
