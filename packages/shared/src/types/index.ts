export type UserRole = 'CREATOR' | 'BRAND' | 'ADMIN';
export type BrandMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type CampaignStatus = 'DRAFT' | 'LIVE' | 'PAUSED' | 'CLOSED';
export type ApplicationStatus = 'PENDING' | 'SHORTLISTED' | 'OFFERED' | 'COUNTER_OFFERED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'COUNTERED';
export type ContractStatus = 'ACTIVE' | 'DELIVERING' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
export type DeliverableStatus = 'PENDING' | 'SUBMITTED' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED';
export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'RELEASED' | 'REFUNDED' | 'FAILED' | 'CANCELLED';
export type PlanTier = 'FREE' | 'PRO' | 'ENTERPRISE';
export type SocialPlatform = 'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE' | 'TWITTER' | 'FACEBOOK' | 'LINKEDIN';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: UserRole;
  brandId?: string;
  brandRole?: BrandMemberRole;
}

export interface CreatorCard {
  id: string;
  displayName: string;
  slug: string;
  avatarUrl?: string;
  location?: string;
  totalFollowers: number;
  startingPrice?: number;
  categories: string[];
  verificationStatus: VerificationStatus;
  platforms: SocialPlatform[];
  isAvailable: boolean;
}

export interface WebSocketEvents {
  'message:new': { conversationId: string; message: unknown };
  'message:typing': { conversationId: string; userId: string };
  'message:read': { conversationId: string; userId: string };
  'notification:new': { notification: unknown };
}
