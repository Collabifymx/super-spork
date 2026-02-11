import {
  Injectable, NotFoundException, ForbiddenException,
  BadRequestException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  APPLICATION_STATE_MACHINE,
  isValidStateTransition,
  CreateApplicationInput,
  CreateOfferInput,
} from '@collabify/shared';

@Injectable()
export class ProposalsService {
  constructor(private prisma: PrismaService) {}

  // ── Applications ──────────────────────────────────────

  async createApplication(creatorUserId: string, data: CreateApplicationInput) {
    const creator = await this.prisma.creatorProfile.findUnique({ where: { userId: creatorUserId } });
    if (!creator) throw new NotFoundException('Creator profile not found');

    const campaign = await this.prisma.campaign.findUnique({ where: { id: data.campaignId } });
    if (!campaign || campaign.status !== 'LIVE') {
      throw new BadRequestException('Campaign is not accepting applications');
    }

    // Unique constraint will also prevent this, but let's give a nice message
    const existing = await this.prisma.application.findUnique({
      where: { campaignId_creatorId: { campaignId: data.campaignId, creatorId: creator.id } },
    });
    if (existing) throw new ConflictException('You have already applied to this campaign');

    return this.prisma.application.create({
      data: {
        campaignId: data.campaignId,
        creatorId: creator.id,
        coverLetter: data.coverLetter,
        priceInCents: data.priceInCents,
        estimatedDays: data.estimatedDays,
      },
      include: { campaign: { select: { title: true, brandId: true } } },
    });
  }

  async getApplicationsForCampaign(campaignId: string, brandId: string, page = 1, limit = 20) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException();
    if (campaign.brandId !== brandId) throw new ForbiddenException();

    const [data, total] = await Promise.all([
      this.prisma.application.findMany({
        where: { campaignId },
        include: {
          creator: {
            include: {
              user: { select: { avatarUrl: true, firstName: true, lastName: true } },
              socialAccounts: true,
            },
          },
          offers: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.application.count({ where: { campaignId } }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getMyApplications(creatorUserId: string, page = 1, limit = 20) {
    const creator = await this.prisma.creatorProfile.findUnique({ where: { userId: creatorUserId } });
    if (!creator) throw new NotFoundException();

    const [data, total] = await Promise.all([
      this.prisma.application.findMany({
        where: { creatorId: creator.id },
        include: {
          campaign: { include: { brand: { select: { name: true, logoUrl: true } } } },
          offers: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.application.count({ where: { creatorId: creator.id } }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateApplicationStatus(applicationId: string, newStatus: string, userId: string, isBrand: boolean) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { campaign: true, creator: true },
    });
    if (!application) throw new NotFoundException();

    // Permission check
    if (isBrand && application.campaign.brandId !== userId) {
      throw new ForbiddenException();
    }

    if (!isValidStateTransition(APPLICATION_STATE_MACHINE, application.status, newStatus)) {
      throw new BadRequestException(`Cannot transition from ${application.status} to ${newStatus}`);
    }

    return this.prisma.application.update({
      where: { id: applicationId },
      data: { status: newStatus as any },
    });
  }

  // ── Offers ────────────────────────────────────────────

  async createOffer(applicationId: string, brandId: string, data: Omit<CreateOfferInput, 'applicationId'>) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { campaign: true },
    });
    if (!application) throw new NotFoundException();
    if (application.campaign.brandId !== brandId) throw new ForbiddenException();

    // Check no pending offer exists to prevent duplicates
    const pendingOffer = await this.prisma.offer.findFirst({
      where: { applicationId, status: 'PENDING' },
    });
    if (pendingOffer) throw new ConflictException('There is already a pending offer for this application');

    const offer = await this.prisma.$transaction(async (tx) => {
      // Update application status
      await tx.application.update({
        where: { id: applicationId },
        data: { status: 'OFFERED' },
      });

      return tx.offer.create({
        data: {
          applicationId,
          fromBrand: true,
          priceInCents: data.priceInCents,
          message: data.message,
          deliverables: data.deliverables || [],
          deadline: data.deadline ? new Date(data.deadline) : undefined,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
    });

    return offer;
  }

  async respondToOffer(offerId: string, creatorUserId: string, accepted: boolean) {
    const creator = await this.prisma.creatorProfile.findUnique({ where: { userId: creatorUserId } });
    if (!creator) throw new NotFoundException();

    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { application: { include: { campaign: true } } },
    });
    if (!offer) throw new NotFoundException();
    if (offer.application.creatorId !== creator.id) throw new ForbiddenException();
    if (offer.status !== 'PENDING') throw new BadRequestException('Offer is no longer pending');

    const newStatus = accepted ? 'ACCEPTED' : 'REJECTED';

    return this.prisma.$transaction(async (tx) => {
      const updatedOffer = await tx.offer.update({
        where: { id: offerId },
        data: { status: newStatus, respondedAt: new Date() },
      });

      await tx.application.update({
        where: { id: offer.applicationId },
        data: { status: accepted ? 'ACCEPTED' : 'REJECTED' },
      });

      // If accepted, create contract
      if (accepted) {
        await tx.contract.create({
          data: {
            applicationId: offer.applicationId,
            campaignId: offer.application.campaignId,
            creatorId: creator.id,
            brandId: offer.application.campaign.brandId,
            priceInCents: offer.priceInCents,
            deliverables: offer.deliverables,
            deadline: offer.deadline,
          },
        });
      }

      return updatedOffer;
    });
  }

  async counterOffer(offerId: string, creatorUserId: string, priceInCents: number, message?: string) {
    const creator = await this.prisma.creatorProfile.findUnique({ where: { userId: creatorUserId } });
    if (!creator) throw new NotFoundException();

    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { application: true },
    });
    if (!offer) throw new NotFoundException();
    if (offer.application.creatorId !== creator.id) throw new ForbiddenException();

    return this.prisma.$transaction(async (tx) => {
      await tx.offer.update({
        where: { id: offerId },
        data: { status: 'COUNTERED', respondedAt: new Date() },
      });

      await tx.application.update({
        where: { id: offer.applicationId },
        data: { status: 'COUNTER_OFFERED' },
      });

      return tx.offer.create({
        data: {
          applicationId: offer.applicationId,
          fromBrand: false,
          priceInCents,
          message,
          deliverables: offer.deliverables,
          deadline: offer.deadline,
        },
      });
    });
  }
}
