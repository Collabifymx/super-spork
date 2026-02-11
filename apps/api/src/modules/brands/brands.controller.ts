import {
  Controller, Get, Patch, Post, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SubscriptionGuard } from '../../common/guards/subscription.guard';
import { CurrentUser, Roles, RequireFeature } from '../../common/decorators/current-user.decorator';
import { BrandsService } from './brands.service';

@ApiTags('brands')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('brands')
export class BrandsController {
  constructor(private brandsService: BrandsService) {}

  @Get(':id')
  @Roles('BRAND', 'ADMIN')
  @ApiOperation({ summary: 'Get brand details' })
  async getBrand(@Param('id') id: string) {
    return this.brandsService.getBrand(id);
  }

  @Patch(':id')
  @Roles('BRAND')
  @ApiOperation({ summary: 'Update brand' })
  async updateBrand(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.brandsService.updateBrand(id, user.sub, body);
  }

  @Post(':id/members')
  @Roles('BRAND')
  @ApiOperation({ summary: 'Invite team member' })
  async inviteMember(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.brandsService.inviteMember(id, user.sub, body.email, body.role);
  }

  @Delete(':id/members/:memberId')
  @Roles('BRAND')
  @ApiOperation({ summary: 'Remove team member' })
  async removeMember(@Param('id') id: string, @Param('memberId') memberId: string, @CurrentUser() user: any) {
    return this.brandsService.removeMember(id, user.sub, memberId);
  }

  @Get(':id/shortlist')
  @Roles('BRAND')
  @UseGuards(SubscriptionGuard)
  @RequireFeature('canShortlist')
  @ApiOperation({ summary: 'Get shortlisted creators' })
  async getShortlist(@Param('id') id: string) {
    return this.brandsService.getShortlist(id);
  }

  @Post(':id/shortlist/:creatorId')
  @Roles('BRAND')
  @UseGuards(SubscriptionGuard)
  @RequireFeature('canShortlist')
  @ApiOperation({ summary: 'Toggle shortlist creator' })
  async toggleShortlist(@Param('id') id: string, @Param('creatorId') creatorId: string) {
    return this.brandsService.toggleShortlist(id, creatorId);
  }
}
