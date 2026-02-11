import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateCreatorProfileInput } from '@collabify/shared';

@Injectable()
export class CreatorsService {
  constructor(private prisma: PrismaService) {}

  async getProfile(slug: string) {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { slug },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true } },
        socialAccounts: true,
        portfolioItems: { orderBy: { sortOrder: 'asc' } },
        rates: { where: { isActive: true } },
      },
    });
    if (!profile) throw new NotFoundException('Creator not found');
    return profile;
  }

  async getProfileByUserId(userId: string) {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
      include: {
        socialAccounts: true,
        portfolioItems: { orderBy: { sortOrder: 'asc' } },
        rates: { where: { isActive: true } },
      },
    });
    if (!profile) throw new NotFoundException('Creator profile not found');
    return profile;
  }

  async updateProfile(userId: string, data: UpdateCreatorProfileInput) {
    const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Creator profile not found');

    // Recalculate total followers if needed
    let totalFollowers: number | undefined;
    if (data.categories && data.categories.length > 3) {
      throw new ForbiddenException('Maximum 3 categories allowed');
    }

    return this.prisma.creatorProfile.update({
      where: { userId },
      data: { ...data, totalFollowers },
      include: { socialAccounts: true, rates: true },
    });
  }

  async addSocialAccount(userId: string, data: any) {
    const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Creator profile not found');

    const account = await this.prisma.socialAccount.upsert({
      where: { creatorId_platform: { creatorId: profile.id, platform: data.platform } },
      update: data,
      create: { creatorId: profile.id, ...data },
    });

    // Recalculate total followers
    const accounts = await this.prisma.socialAccount.findMany({ where: { creatorId: profile.id } });
    const totalFollowers = accounts.reduce((sum, a) => sum + a.followers, 0);
    await this.prisma.creatorProfile.update({
      where: { id: profile.id },
      data: { totalFollowers },
    });

    return account;
  }

  async removeSocialAccount(userId: string, platform: string) {
    const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Creator profile not found');

    await this.prisma.socialAccount.delete({
      where: { creatorId_platform: { creatorId: profile.id, platform: platform as any } },
    });

    // Recalculate
    const accounts = await this.prisma.socialAccount.findMany({ where: { creatorId: profile.id } });
    const totalFollowers = accounts.reduce((sum, a) => sum + a.followers, 0);
    await this.prisma.creatorProfile.update({ where: { id: profile.id }, data: { totalFollowers } });
  }

  async addPortfolioItem(userId: string, data: any) {
    const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Creator profile not found');
    return this.prisma.portfolioItem.create({ data: { creatorId: profile.id, ...data } });
  }

  async removePortfolioItem(userId: string, itemId: string) {
    const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException();
    const item = await this.prisma.portfolioItem.findFirst({ where: { id: itemId, creatorId: profile.id } });
    if (!item) throw new NotFoundException('Portfolio item not found');
    await this.prisma.portfolioItem.delete({ where: { id: itemId } });
  }

  async addRate(userId: string, data: any) {
    const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException();
    return this.prisma.creatorRate.create({ data: { creatorId: profile.id, ...data } });
  }

  async removeRate(userId: string, rateId: string) {
    const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException();
    await this.prisma.creatorRate.deleteMany({ where: { id: rateId, creatorId: profile.id } });
  }
}
