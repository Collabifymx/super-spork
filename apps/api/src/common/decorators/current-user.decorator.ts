import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { REQUIRE_FEATURE } from '../guards/subscription.guard';

// Extract current user from request
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

// Role-based access
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// Feature gating
export const RequireFeature = (feature: string) => SetMetadata(REQUIRE_FEATURE, feature);
