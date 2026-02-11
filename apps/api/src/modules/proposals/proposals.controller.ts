import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SubscriptionGuard } from '../../common/guards/subscription.guard';
import { CurrentUser, Roles, RequireFeature } from '../../common/decorators/current-user.decorator';
import { ProposalsService } from './proposals.service';

@ApiTags('applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('applications')
export class ProposalsController {
  constructor(private proposalsService: ProposalsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('CREATOR')
  @ApiOperation({ summary: 'Creator applies to campaign' })
  async apply(@CurrentUser() user: any, @Body() body: any) {
    return this.proposalsService.createApplication(user.sub, body);
  }

  @Get('campaign/:campaignId')
  @UseGuards(RolesGuard, SubscriptionGuard)
  @Roles('BRAND', 'ADMIN')
  @RequireFeature('canViewFullProposals')
  @ApiOperation({ summary: 'Get applications for campaign (brand)' })
  async getForCampaign(
    @Param('campaignId') campaignId: string,
    @CurrentUser() user: any,
    @Query('page') page?: number,
  ) {
    return this.proposalsService.getApplicationsForCampaign(campaignId, user.brandId, page);
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles('CREATOR')
  @ApiOperation({ summary: 'Get my applications (creator)' })
  async getMyApplications(@CurrentUser() user: any, @Query('page') page?: number) {
    return this.proposalsService.getMyApplications(user.sub, page);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('BRAND')
  @ApiOperation({ summary: 'Update application status (shortlist/reject)' })
  async updateStatus(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { status: string }) {
    return this.proposalsService.updateApplicationStatus(id, body.status, user.brandId, true);
  }

  @Post(':id/offer')
  @UseGuards(RolesGuard, SubscriptionGuard)
  @Roles('BRAND')
  @RequireFeature('canContract')
  @ApiOperation({ summary: 'Send offer to creator' })
  async sendOffer(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.proposalsService.createOffer(id, user.brandId, body);
  }

  @Post('offers/:offerId/respond')
  @UseGuards(RolesGuard)
  @Roles('CREATOR')
  @ApiOperation({ summary: 'Accept or reject offer' })
  async respondOffer(@Param('offerId') offerId: string, @CurrentUser() user: any, @Body() body: { accepted: boolean }) {
    return this.proposalsService.respondToOffer(offerId, user.sub, body.accepted);
  }

  @Post('offers/:offerId/counter')
  @UseGuards(RolesGuard)
  @Roles('CREATOR')
  @ApiOperation({ summary: 'Counter-offer' })
  async counterOffer(
    @Param('offerId') offerId: string,
    @CurrentUser() user: any,
    @Body() body: { priceInCents: number; message?: string },
  ) {
    return this.proposalsService.counterOffer(offerId, user.sub, body.priceInCents, body.message);
  }
}
