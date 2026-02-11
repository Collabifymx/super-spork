import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles } from '../../common/decorators/current-user.decorator';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private svc: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get plans' })
  async getPlans() { return this.svc.getPlans(); }

  @Get('current')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BRAND')
  @ApiBearerAuth()
  async getCurrent(@CurrentUser() user: any) { return this.svc.getCurrentSubscription(user.brandId); }

  @Post('checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BRAND')
  @ApiBearerAuth()
  async checkout(@CurrentUser() user: any, @Body() body: { planTier: string; billingCycle: 'monthly' | 'yearly' }) {
    return this.svc.createCheckoutSession(user.brandId, body.planTier, body.billingCycle);
  }
}
