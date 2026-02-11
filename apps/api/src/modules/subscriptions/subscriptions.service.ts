import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService, private config: ConfigService) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY', ''), { apiVersion: '2024-11-20.acacia' as any });
  }

  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { priceMonthly: 'asc' } });
  }

  async getCurrentSubscription(brandId: string) {
    return this.prisma.subscription.findUnique({ where: { brandId }, include: { plan: true } });
  }

  async createCheckoutSession(brandId: string, planTier: string, billingCycle: 'monthly' | 'yearly') {
    const plan = await this.prisma.subscriptionPlan.findFirst({ where: { tier: planTier as any } });
    if (!plan) throw new NotFoundException('Plan not found');
    const priceId = billingCycle === 'yearly' ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;
    if (!priceId) throw new BadRequestException('Stripe price not configured for this plan');

    const sub = await this.prisma.subscription.findUnique({ where: { brandId } });
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: sub?.stripeCustomerId || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.config.get('WEB_URL')}/settings/billing?success=true`,
      cancel_url: `${this.config.get('WEB_URL')}/settings/billing?cancelled=true`,
      metadata: { brandId, planTier },
    });
    return { url: session.url };
  }
}
