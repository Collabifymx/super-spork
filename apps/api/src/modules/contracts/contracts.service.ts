import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CONTRACT_STATE_MACHINE, isValidStateTransition } from '@collabify/shared';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        campaign: { select: { title: true, slug: true } },
        creator: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
        application: true,
        deliverableItems: { include: { submissions: true, reviews: true } },
        paymentIntents: true,
        ledgerEntries: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async findByBrand(brandId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.contract.findMany({
        where: { brandId },
        include: {
          campaign: { select: { title: true } },
          creator: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.contract.count({ where: { brandId } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByCreator(creatorUserId: string, page = 1, limit = 20) {
    const creator = await this.prisma.creatorProfile.findUnique({ where: { userId: creatorUserId } });
    if (!creator) throw new NotFoundException();

    const [data, total] = await Promise.all([
      this.prisma.contract.findMany({
        where: { creatorId: creator.id },
        include: {
          campaign: { include: { brand: { select: { name: true, logoUrl: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.contract.count({ where: { creatorId: creator.id } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateStatus(contractId: string, newStatus: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) throw new NotFoundException();

    if (!isValidStateTransition(CONTRACT_STATE_MACHINE, contract.status, newStatus)) {
      throw new BadRequestException(`Cannot transition from ${contract.status} to ${newStatus}`);
    }

    const updateData: any = { status: newStatus as any };
    if (newStatus === 'COMPLETED') updateData.completedAt = new Date();
    if (newStatus === 'CANCELLED') updateData.cancelledAt = new Date();

    return this.prisma.contract.update({ where: { id: contractId }, data: updateData });
  }
}
