import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles } from '../../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Admin dashboard stats' })
  async dashboard() { return this.adminService.getDashboardStats(); }

  @Get('verifications')
  @ApiOperation({ summary: 'Pending verifications' })
  async verifications(@Query('page') page?: number) { return this.adminService.getPendingVerifications(page); }

  @Post('verify')
  @ApiOperation({ summary: 'Verify or reject creator' })
  async verify(@CurrentUser() user: any, @Body() body: { creatorId: string; status: 'VERIFIED' | 'REJECTED'; rejectionReason?: string }) {
    return this.adminService.verifyCreator(body.creatorId, body.status, body.rejectionReason, user.sub);
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'All campaigns' })
  async campaigns(@Query('page') page?: number) { return this.adminService.getAllCampaigns(page); }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Audit logs' })
  async auditLogs(@Query('page') page?: number) { return this.adminService.getAuditLogs(page); }

  @Post('commission')
  @ApiOperation({ summary: 'Update commission rate' })
  async updateCommission(@Body() body: { rate: number }) { return this.adminService.updateCommissionRate(body.rate); }
}
