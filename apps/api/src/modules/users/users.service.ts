import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, role: true, firstName: true, lastName: true,
        avatarUrl: true, isActive: true, createdAt: true, lastLoginAt: true,
        creatorProfile: { select: { id: true, slug: true, displayName: true } },
        brandMembers: { include: { brand: { select: { id: true, name: true, slug: true } } } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; avatarUrl?: string }) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }
}
