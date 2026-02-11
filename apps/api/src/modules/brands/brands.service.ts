import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { slugify } from '@collabify/shared';
import { v4 as uuid } from 'uuid';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async getBrand(brandId: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } } } },
        subscription: { include: { plan: true } },
        _count: { select: { campaigns: true } },
      },
    });
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }

  async updateBrand(brandId: string, userId: string, data: any) {
    await this.ensureBrandAdmin(brandId, userId);
    return this.prisma.brand.update({ where: { id: brandId }, data });
  }

  async inviteMember(brandId: string, inviterId: string, email: string, role: string) {
    await this.ensureBrandAdmin(brandId, inviterId);

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found with that email');

    const existing = await this.prisma.brandMember.findUnique({
      where: { brandId_userId: { brandId, userId: user.id } },
    });
    if (existing) throw new ConflictException('User is already a member');

    return this.prisma.brandMember.create({
      data: { brandId, userId: user.id, role: role as any },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  async removeMember(brandId: string, requesterId: string, memberId: string) {
    await this.ensureBrandAdmin(brandId, requesterId);

    const member = await this.prisma.brandMember.findFirst({
      where: { brandId, userId: memberId },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'OWNER') throw new ForbiddenException('Cannot remove the owner');

    await this.prisma.brandMember.delete({ where: { id: member.id } });
  }

  async getShortlist(brandId: string) {
    return this.prisma.shortlist.findMany({
      where: { brandId },
      include: {
        creator: {
          include: {
            user: { select: { avatarUrl: true } },
            socialAccounts: true,
          },
        },
      },
    });
  }

  async toggleShortlist(brandId: string, creatorId: string) {
    const existing = await this.prisma.shortlist.findUnique({
      where: { brandId_creatorId: { brandId, creatorId } },
    });
    if (existing) {
      await this.prisma.shortlist.delete({ where: { id: existing.id } });
      return { shortlisted: false };
    }
    await this.prisma.shortlist.create({ data: { brandId, creatorId } });
    return { shortlisted: true };
  }

  private async ensureBrandAdmin(brandId: string, userId: string) {
    const member = await this.prisma.brandMember.findUnique({
      where: { brandId_userId: { brandId, userId } },
    });
    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      throw new ForbiddenException('Insufficient brand permissions');
    }
  }
}
