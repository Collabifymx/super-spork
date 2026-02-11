import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/modules/auth/auth.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    creatorProfile: { create: jest.fn() },
    brand: { create: jest.fn() },
    brandMember: { create: jest.fn() },
    subscriptionPlan: { findFirst: jest.fn() },
    subscription: { create: jest.fn() },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    auditLog: { create: jest.fn() },
    brandMember: { findFirst: jest.fn() },
    $transaction: jest.fn((cb: any) => cb(mockPrisma)),
  };

  const mockJwt = { sign: jest.fn(() => 'mock-token') };
  const mockConfig = { get: jest.fn((key: string, def?: any) => def || 'test') };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('should throw ConflictException if email exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: '1', email: 'test@test.com' });
      await expect(
        service.register({ email: 'test@test.com', password: 'Password123', firstName: 'Test', lastName: 'User', role: 'CREATOR' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user and return tokens for new registration', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce({
        id: 'new-id', email: 'new@test.com', role: 'CREATOR', firstName: 'New', lastName: 'User',
      });
      mockPrisma.creatorProfile.create.mockResolvedValueOnce({ id: 'profile-id' });
      mockPrisma.auditLog.create.mockResolvedValueOnce({});
      mockPrisma.refreshToken.create.mockResolvedValueOnce({});

      const result = await service.register({
        email: 'new@test.com', password: 'Password123', firstName: 'New', lastName: 'User', role: 'CREATOR',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.login({ email: 'test@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
