import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchCreatorsInput } from '@collabify/shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async searchCreators(params: SearchCreatorsInput) {
    const {
      query, categories, platforms, location,
      minFollowers, maxFollowers, minPrice, maxPrice,
      languages, verifiedOnly, sortBy, page, limit,
    } = params;

    const where: Prisma.CreatorProfileWhereInput = {
      isAvailable: true,
      user: { isActive: true },
    };

    // Text search on displayName, bio, tags
    if (query) {
      where.OR = [
        { displayName: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: [query.toLowerCase()] } },
        { location: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (categories?.length) {
      where.categories = { hasSome: categories };
    }

    if (location) {
      where.OR = [
        ...(where.OR as any[] || []),
        { city: { contains: location, mode: 'insensitive' } },
        { country: { contains: location, mode: 'insensitive' } },
        { location: { contains: location, mode: 'insensitive' } },
      ];
    }

    if (minFollowers !== undefined) where.totalFollowers = { ...where.totalFollowers as any, gte: minFollowers };
    if (maxFollowers !== undefined) where.totalFollowers = { ...where.totalFollowers as any, lte: maxFollowers };
    if (minPrice !== undefined) where.startingPrice = { ...where.startingPrice as any, gte: minPrice };
    if (maxPrice !== undefined) where.startingPrice = { ...where.startingPrice as any, lte: maxPrice };
    if (verifiedOnly) where.verificationStatus = 'VERIFIED';

    if (languages?.length) {
      where.languages = { hasSome: languages };
    }

    if (platforms?.length) {
      where.socialAccounts = { some: { platform: { in: platforms as any } } };
    }

    // Sort
    let orderBy: Prisma.CreatorProfileOrderByWithRelationInput = { createdAt: 'desc' };
    switch (sortBy) {
      case 'followers': orderBy = { totalFollowers: 'desc' }; break;
      case 'price_asc': orderBy = { startingPrice: 'asc' }; break;
      case 'price_desc': orderBy = { startingPrice: 'desc' }; break;
      case 'response_time': orderBy = { responseTimeHours: 'asc' }; break;
      default: orderBy = { totalFollowers: 'desc' };
    }

    const [data, total] = await Promise.all([
      this.prisma.creatorProfile.findMany({
        where,
        include: {
          user: { select: { id: true, avatarUrl: true, firstName: true, lastName: true } },
          socialAccounts: { select: { platform: true, followers: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.creatorProfile.count({ where }),
    ]);

    return {
      data: data.map((c) => ({
        id: c.id,
        displayName: c.displayName,
        slug: c.slug,
        avatarUrl: c.user.avatarUrl,
        location: c.location,
        totalFollowers: c.totalFollowers,
        startingPrice: c.startingPrice,
        categories: c.categories,
        verificationStatus: c.verificationStatus,
        platforms: c.socialAccounts.map((s) => s.platform),
        isAvailable: c.isAvailable,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
