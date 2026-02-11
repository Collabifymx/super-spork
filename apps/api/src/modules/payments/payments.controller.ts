import {
  Controller, Get, Post, Param, Body, UseGuards, Req, RawBodyRequest, Headers,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { Request } from 'express';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('intent/:contractId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment intent (escrow hold)' })
  async createIntent(@Param('contractId') contractId: string, @CurrentUser() user: any) {
    return this.paymentsService.createPaymentIntent(contractId, user.brandId);
  }

  @Post('capture/:contractId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Capture authorized payment' })
  async capture(@Param('contractId') contractId: string) {
    return this.paymentsService.capturePayment(contractId);
  }

  @Post('release/:contractId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Release funds to creator' })
  async release(@Param('contractId') contractId: string) {
    return this.paymentsService.releaseToCeator(contractId);
  }

  @Get('ledger/:contractId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ledger for contract' })
  async getLedger(@Param('contractId') contractId: string) {
    return this.paymentsService.getLedger(contractId);
  }

  @Get('payouts/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my payouts (creator)' })
  async getMyPayouts(@CurrentUser() user: any) {
    return this.paymentsService.getCreatorPayouts(user.sub);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook' })
  async webhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.paymentsService.handleWebhook(signature, req.rawBody!);
  }
}
