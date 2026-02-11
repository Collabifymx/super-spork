import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCampaignInput, isValidStateTransition, CAMPAIGN_STATE_MACHINE, slugify } from '@collabify/shared';
import { v4 as uuid } from 'uuid';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

  async create(brandId: string, data: CreateCampaignInput) {
    const slug = slugify(data.title) + '-' + uuid().slice(0, 8);
    const { targeting, ...campaignData } = data;

    return this.prisma.campaign.create({
      data: {
        ...campaignData,
        brandId,
        slug,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        targeting: targeting ? { create: { ...targeting, platforms: targeting.platforms || [] } } : undefined,
      },
      include: { targeting: true, attachments: true },
    });
  }

  async findById(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        brand: { select: { id: true, name: true, slug: true, logoUrl: true } },
        targeting: true,
        attachments: true,
        _count: { select: { applications: true, contracts: true } },
      },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async findByBrand(brandId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where: { brandId },
        include: {
          targeting: true,
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.campaign.count({ where: { brandId } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findLive(page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where: { status: 'LIVE' },
        include: {
          brand: { select: { id: true, name: true, logoUrl: true } },
          targeting: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.campaign.count({ where: { status: 'LIVE' } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateStatus(campaignId: string, brandId: string, newStatus: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.brandId !== brandId) throw new ForbiddenException();

    if (!isValidStateTransition(CAMPAIGN_STATE_MACHINE, campaign.status, newStatus)) {
      throw new BadRequestException(`Cannot transition from ${campaign.status} to ${newStatus}`);
    }

    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: newStatus as any },
    });
  }

  async update(campaignId: string, brandId: string, data: Partial<CreateCampaignInput>) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException();
    if (campaign.brandId !== brandId) throw new ForbiddenException();
    if (campaign.status !== 'DRAFT') throw new BadRequestException('Can only edit draft campaigns');

    const { targeting, ...rest } = data;
    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        ...rest,
        deadline: rest.deadline ? new Date(rest.deadline) : undefined,
        targeting: targeting ? { upsert: { create: { ...targeting, platforms: targeting.platforms || [] }, update: targeting } } : undefined,
      },
      include: { targeting: true },
    });
  }
}
