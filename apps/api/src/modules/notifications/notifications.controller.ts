import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private svc: NotificationsService) {}

  @Get()
  async getAll(@CurrentUser() user: any, @Query('unread') unread?: string) {
    return this.svc.getForUser(user.sub, unread === 'true');
  }

  @Get('count')
  async getCount(@CurrentUser() user: any) {
    return { count: await this.svc.getUnreadCount(user.sub) };
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @CurrentUser() user: any) {
    await this.svc.markAsRead(id, user.sub);
    return { success: true };
  }

  @Patch('read-all')
  async markAllRead(@CurrentUser() user: any) {
    await this.svc.markAllAsRead(user.sub);
    return { success: true };
  }
}
