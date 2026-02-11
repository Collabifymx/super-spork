import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getPendingVerifications(page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.creatorProfile.findMany({
        where: { verificationStatus: 'PENDING' },
        include: { user: { select: { email: true, firstName: true, lastName: true } }, socialAccounts: true },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.creatorProfile.count({ where: { verificationStatus: 'PENDING' } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async verifyCreator(creatorId: string, status: 'VERIFIED' | 'REJECTED', rejectionReason?: string, adminId?: string) {
    const profile = await this.prisma.creatorProfile.findUnique({ where: { id: creatorId } });
    if (!profile) throw new NotFoundException('Creator not found');

    const updated = await this.prisma.creatorProfile.update({
      where: { id: creatorId },
      data: {
        verificationStatus: status,
        verifiedAt: status === 'VERIFIED' ? new Date() : undefined,
        rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: `admin.creator.${status.toLowerCase()}`,
        entityType: 'CreatorProfile',
        entityId: creatorId,
        metadata: { rejectionReason },
      },
    });

    return updated;
  }

  async getDashboardStats() {
    const [users, creators, brands, campaigns, contracts, revenue] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.creatorProfile.count(),
      this.prisma.brand.count(),
      this.prisma.campaign.count(),
      this.prisma.contract.count(),
      this.prisma.ledgerEntry.aggregate({
        where: { type: 'PLATFORM_COMMISSION' },
        _sum: { amountInCents: true },
      }),
    ]);
    return { users, creators, brands, campaigns, contracts, totalRevenue: revenue._sum.amountInCents || 0 };
  }

  async getAuditLogs(page = 1, limit = 50) {
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.auditLog.count(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAllCampaigns(page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({
        include: { brand: { select: { name: true } }, _count: { select: { applications: true, contracts: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.campaign.count(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateCommissionRate(rate: number) {
    // Update default for new contracts (stored in app config or env)
    // For now, just return the new rate
    return { commissionRate: rate };
  }
}
