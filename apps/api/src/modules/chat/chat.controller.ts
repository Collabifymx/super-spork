import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../../common/guards/subscription.guard';
import { CurrentUser, RequireFeature } from '../../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('conversations')
  @UseGuards(SubscriptionGuard)
  @RequireFeature('canMessage')
  @ApiOperation({ summary: 'Create or get conversation' })
  async createConversation(@CurrentUser() user: any, @Body() body: { creatorId: string; campaignId?: string }) {
    return this.chatService.getOrCreateConversation(user.brandId, body.creatorId, body.campaignId);
  }

  @Get('inbox')
  @ApiOperation({ summary: 'Get inbox' })
  async getInbox(
    @CurrentUser() user: any,
    @Query('unread') unread?: string,
    @Query('assignedToMe') assignedToMe?: string,
    @Query('campaignId') campaignId?: string,
  ) {
    return this.chatService.getInbox(user.sub, user.brandId, {
      unread: unread === 'true' ? true : unread === 'false' ? false : undefined,
      assignedToMe: assignedToMe === 'true',
      campaignId,
    });
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation' })
  async getConversation(@Param('id') id: string, @CurrentUser() user: any) {
    return this.chatService.getConversation(id, user.sub);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages' })
  async getMessages(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getMessages(id, user.sub, page, limit);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send message (REST fallback)' })
  async sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { content: string; attachmentUrl?: string; attachmentName?: string },
  ) {
    return this.chatService.sendMessage(id, user.sub, body.content, body.attachmentUrl, body.attachmentName);
  }

  @Patch('conversations/:id/read')
  @ApiOperation({ summary: 'Mark conversation as read' })
  async markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    await this.chatService.markAsRead(id, user.sub);
    return { success: true };
  }

  @Post('conversations/:id/assign')
  @ApiOperation({ summary: 'Assign conversation to team member' })
  async assign(@Param('id') id: string, @Body() body: { userId: string }) {
    await this.chatService.assignConversation(id, body.userId);
    return { success: true };
  }
}
