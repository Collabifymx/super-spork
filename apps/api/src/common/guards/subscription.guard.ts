import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PLAN_FEATURES } from '@collabify/shared';

export const REQUIRE_FEATURE = 'require_feature';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.get<string>(REQUIRE_FEATURE, context.getHandler());
    if (!requiredFeature) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Admins bypass
    if (user.role === 'ADMIN') return true;
    // Creators don't need subscription
    if (user.role === 'CREATOR') return true;

    if (!user.brandId) throw new ForbiddenException('No brand associated');

    const subscription = await this.prisma.subscription.findUnique({
      where: { brandId: user.brandId },
      include: { plan: true },
    });

    const tier = subscription?.plan?.tier || 'FREE';
    const features = PLAN_FEATURES[tier as keyof typeof PLAN_FEATURES];

    if (!features || !(features as any)[requiredFeature]) {
      throw new ForbiddenException(
        JSON.stringify({
          code: 'PAYWALL',
          message: `This feature requires a paid plan`,
          requiredFeature,
          currentTier: tier,
        }),
      );
    }

    return true;
  }
}
