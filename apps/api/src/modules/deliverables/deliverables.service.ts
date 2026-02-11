import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DeliverablesService {
  constructor(private prisma: PrismaService) {}

  async getByContract(contractId: string) {
    return this.prisma.deliverable.findMany({
      where: { contractId },
      include: { submissions: { orderBy: { version: 'desc' } }, reviews: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async submit(deliverableId: string, creatorUserId: string, data: { fileUrl?: string; linkUrl?: string; notes?: string }) {
    const deliverable = await this.prisma.deliverable.findUnique({
      where: { id: deliverableId },
      include: { creator: true },
    });
    if (!deliverable) throw new NotFoundException();
    if (deliverable.creator.userId !== creatorUserId) throw new ForbiddenException();
    if (!['PENDING', 'CHANGES_REQUESTED'].includes(deliverable.status)) {
      throw new BadRequestException('Cannot submit at this stage');
    }

    const lastSubmission = await this.prisma.deliverableSubmission.findFirst({
      where: { deliverableId },
      orderBy: { version: 'desc' },
    });

    return this.prisma.$transaction(async (tx) => {
      const submission = await tx.deliverableSubmission.create({
        data: {
          deliverableId,
          fileUrl: data.fileUrl,
          linkUrl: data.linkUrl,
          notes: data.notes,
          version: (lastSubmission?.version || 0) + 1,
        },
      });

      await tx.deliverable.update({
        where: { id: deliverableId },
        data: { status: 'SUBMITTED' },
      });

      // Update contract status
      await tx.contract.update({
        where: { id: deliverable.contractId },
        data: { status: 'IN_REVIEW' },
      });

      return submission;
    });
  }

  async review(deliverableId: string, reviewerId: string, approved: boolean, feedback?: string) {
    const deliverable = await this.prisma.deliverable.findUnique({
      where: { id: deliverableId },
      include: { contract: true },
    });
    if (!deliverable) throw new NotFoundException();
    if (deliverable.status !== 'SUBMITTED') throw new BadRequestException('Not submitted yet');

    return this.prisma.$transaction(async (tx) => {
      const review = await tx.deliverableReview.create({
        data: { deliverableId, approved, feedback, reviewedBy: reviewerId },
      });

      await tx.deliverable.update({
        where: { id: deliverableId },
        data: { status: approved ? 'APPROVED' : 'CHANGES_REQUESTED' },
      });

      // Check if all deliverables are approved
      if (approved) {
        const allDeliverables = await tx.deliverable.findMany({
          where: { contractId: deliverable.contractId },
        });
        const allApproved = allDeliverables.every(
          (d) => d.id === deliverableId ? true : d.status === 'APPROVED',
        );
        if (allApproved) {
          await tx.contract.update({
            where: { id: deliverable.contractId },
            data: { status: 'COMPLETED', completedAt: new Date() },
          });
        }
      }

      return review;
    });
  }
}
