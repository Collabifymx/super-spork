import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterInput, LoginInput } from '@collabify/shared';
import { slugify } from '@collabify/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterInput, ip?: string, userAgent?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: dto.role,
        },
      });

      // Auto-create profiles based on role
      if (dto.role === 'CREATOR') {
        const displayName = `${dto.firstName} ${dto.lastName}`;
        const slug = slugify(displayName) + '-' + uuid().slice(0, 6);
        await tx.creatorProfile.create({
          data: {
            userId: newUser.id,
            displayName,
            slug,
          },
        });
      }

      if (dto.role === 'BRAND') {
        const brand = await tx.brand.create({
          data: {
            name: `${dto.firstName}'s Brand`,
            slug: slugify(`${dto.firstName}-brand`) + '-' + uuid().slice(0, 6),
          },
        });
        await tx.brandMember.create({
          data: { brandId: brand.id, userId: newUser.id, role: 'OWNER' },
        });
        // Create free subscription
        const freePlan = await tx.subscriptionPlan.findFirst({ where: { tier: 'FREE' } });
        if (freePlan) {
          await tx.subscription.create({
            data: {
              brandId: brand.id,
              planId: freePlan.id,
              status: 'ACTIVE',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            },
          });
        }
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: newUser.id,
          action: 'user.registered',
          entityType: 'User',
          entityId: newUser.id,
          metadata: { role: dto.role },
          ipAddress: ip,
          userAgent,
        },
      });

      return newUser;
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role, ip, userAgent);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async login(dto: LoginInput, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is disabled');

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'user.login',
        entityType: 'User',
        entityId: user.id,
        ipAddress: ip,
        userAgent,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role, ip, userAgent);

    // Get brand info if applicable
    let brandId: string | undefined;
    let brandRole: string | undefined;
    if (user.role === 'BRAND') {
      const membership = await this.prisma.brandMember.findFirst({
        where: { userId: user.id, isActive: true },
      });
      if (membership) {
        brandId = membership.brandId;
        brandRole = membership.role;
      }
    }

    return {
      user: { ...this.sanitizeUser(user), brandId, brandRole },
      ...tokens,
    };
  }

  async refreshToken(token: string, ip?: string, userAgent?: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({ where: { token } });
    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({ where: { id: storedToken.userId } });
    if (!user || !user.isActive) throw new UnauthorizedException('User not found');

    return this.generateTokens(user.id, user.email, user.role, ip, userAgent);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, token: refreshToken },
        data: { revokedAt: new Date() },
      });
    } else {
      // Revoke all tokens
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  private async generateTokens(userId: string, email: string, role: string, ip?: string, userAgent?: string) {
    let brandId: string | undefined;
    let brandRole: string | undefined;

    if (role === 'BRAND') {
      const membership = await this.prisma.brandMember.findFirst({
        where: { userId, isActive: true },
      });
      if (membership) {
        brandId = membership.brandId;
        brandRole = membership.role;
      }
    }

    const payload = { sub: userId, email, role, brandId, brandRole };
    const accessToken = this.jwtService.sign(payload);
    const refreshTokenValue = uuid();

    const refreshExpiresIn = this.config.get('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(refreshExpiresIn) || 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId,
        expiresAt,
        userAgent,
        ipAddress: ip,
      },
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
