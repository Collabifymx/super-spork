import {
  Injectable, NotFoundException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateConversation(brandId: string, creatorId: string, campaignId?: string) {
    // Unique constraint prevents duplicates
    const existing = await this.prisma.conversation.findUnique({
      where: {
        brandId_creatorId_campaignId: { brandId, creatorId, campaignId: campaignId || '' },
      },
    });
    if (existing) return existing;

    return this.prisma.conversation.create({
      data: { brandId, creatorId, campaignId },
    });
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        brand: { select: { id: true, name: true, logoUrl: true } },
        creator: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } },
        campaign: { select: { id: true, title: true } },
        assignments: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });
    if (!conversation) throw new NotFoundException();
    // Verify user is participant
    await this.verifyParticipant(conversation, userId);
    return conversation;
  }

  async getInbox(userId: string, brandId?: string, filters?: { unread?: boolean; assignedToMe?: boolean; campaignId?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    let where: any = {};

    if (user.role === 'CREATOR') {
      const creator = await this.prisma.creatorProfile.findUnique({ where: { userId } });
      if (!creator) throw new NotFoundException();
      where.creatorId = creator.id;
    } else if (brandId) {
      where.brandId = brandId;
    }

    if (filters?.campaignId) where.campaignId = filters.campaignId;
    if (filters?.assignedToMe) {
      where.assignments = { some: { userId } };
    }

    const conversations = await this.prisma.conversation.findMany({
      where,
      include: {
        brand: { select: { id: true, name: true, logoUrl: true } },
        creator: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } },
        campaign: { select: { id: true, title: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        readReceipts: { where: { userId } },
        assignments: { select: { userId: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Compute unread status
    return conversations.map((conv) => {
      const lastMessage = conv.messages[0];
      const lastRead = conv.readReceipts[0]?.lastReadAt;
      const hasUnread = lastMessage && (!lastRead || lastMessage.createdAt > lastRead);
      return { ...conv, hasUnread, lastMessage };
    }).filter((conv) => {
      if (filters?.unread === true) return conv.hasUnread;
      if (filters?.unread === false) return !conv.hasUnread;
      return true;
    });
  }

  async getMessages(conversationId: string, userId: string, page = 1, limit = 50) {
    // Verify access
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException();

    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return { data: data.reverse(), total, page, limit };
  }

  async sendMessage(conversationId: string, senderId: string, content: string, attachmentUrl?: string, attachmentName?: string) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException();

    const message = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: { conversationId, senderId, content, attachmentUrl, attachmentName },
        include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      });

      // Update conversation timestamp
      await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

      // Update sender's read receipt
      await tx.readReceipt.upsert({
        where: { conversationId_userId: { conversationId, userId: senderId } },
        update: { lastReadAt: new Date() },
        create: { conversationId, userId: senderId },
      });

      return msg;
    });

    return message;
  }

  async markAsRead(conversationId: string, userId: string) {
    await this.prisma.readReceipt.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      update: { lastReadAt: new Date() },
      create: { conversationId, userId },
    });
  }

  async assignConversation(conversationId: string, assigneeId: string) {
    await this.prisma.conversationAssignment.upsert({
      where: { conversationId_userId: { conversationId, userId: assigneeId } },
      update: {},
      create: { conversationId, userId: assigneeId },
    });
  }

  async unassignConversation(conversationId: string, assigneeId: string) {
    await this.prisma.conversationAssignment.deleteMany({
      where: { conversationId, userId: assigneeId },
    });
  }

  private async verifyParticipant(conversation: any, userId: string) {
    // Check if user is brand member or creator
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException();

    if (user.role === 'ADMIN') return;

    if (user.role === 'CREATOR') {
      const creator = await this.prisma.creatorProfile.findUnique({ where: { userId } });
      if (creator?.id !== conversation.creatorId) throw new ForbiddenException();
    }

    if (user.role === 'BRAND') {
      const member = await this.prisma.brandMember.findFirst({
        where: { brandId: conversation.brandId, userId, isActive: true },
      });
      if (!member) throw new ForbiddenException();
    }
  }
}
