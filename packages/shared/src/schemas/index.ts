import { z } from 'zod';

// ============================================================================
// AUTH
// ============================================================================

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  role: z.enum(['CREATOR', 'BRAND']),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// ============================================================================
// BRAND
// ============================================================================

export const createBrandSchema = z.object({
  name: z.string().min(1).max(100),
  industry: z.string().max(50).optional(),
  website: z.string().url().optional(),
  size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
  bio: z.string().max(1000).optional(),
});

export const inviteBrandMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER']),
});

// ============================================================================
// CREATOR PROFILE
// ============================================================================

export const updateCreatorProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(2000).optional(),
  location: z.string().max(100).optional(),
  city: z.string().max(50).optional(),
  country: z.string().max(50).optional(),
  languages: z.array(z.string()).max(10).optional(),
  categories: z.array(z.string()).max(3, 'Maximum 3 categories').optional(),
  tags: z.array(z.string()).max(20).optional(),
  gender: z.string().max(20).optional(),
  dateOfBirth: z.string().datetime().optional(),
  startingPrice: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional(),
  mediaKitUrl: z.string().url().optional(),
});

export const socialAccountSchema = z.object({
  platform: z.enum(['TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'TWITTER', 'FACEBOOK', 'LINKEDIN']),
  handle: z.string().min(1).max(100),
  profileUrl: z.string().url().optional(),
  followers: z.number().int().min(0).default(0),
  avgViews: z.number().int().min(0).optional(),
  engagementRate: z.number().min(0).max(100).optional(),
});

export const creatorRateSchema = z.object({
  platform: z.enum(['TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'TWITTER', 'FACEBOOK', 'LINKEDIN']),
  deliverable: z.string().min(1).max(100),
  priceInCents: z.number().int().min(100),
  description: z.string().max(500).optional(),
});

// ============================================================================
// CAMPAIGNS
// ============================================================================

export const createCampaignSchema = z.object({
  title: z.string().min(1).max(200),
  objective: z.string().max(1000).optional(),
  brief: z.string().max(5000).optional(),
  platforms: z.array(z.enum(['TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'TWITTER', 'FACEBOOK', 'LINKEDIN'])).optional(),
  deliverables: z.array(z.string()).optional(),
  deadline: z.string().datetime().optional(),
  location: z.string().max(100).optional(),
  budgetMin: z.number().int().min(0).optional(),
  budgetMax: z.number().int().min(0).optional(),
  status: z.enum(['DRAFT', 'LIVE']).default('DRAFT'),
  targeting: z.object({
    minFollowers: z.number().int().min(0).optional(),
    maxFollowers: z.number().int().min(0).optional(),
    categories: z.array(z.string()).optional(),
    locations: z.array(z.string()).optional(),
    genders: z.array(z.string()).optional(),
    ageMin: z.number().int().min(13).optional(),
    ageMax: z.number().int().max(100).optional(),
    platforms: z.array(z.enum(['TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'TWITTER', 'FACEBOOK', 'LINKEDIN'])).optional(),
  }).optional(),
});

export const updateCampaignStatusSchema = z.object({
  status: z.enum(['DRAFT', 'LIVE', 'PAUSED', 'CLOSED']),
});

// ============================================================================
// APPLICATIONS / PROPOSALS
// ============================================================================

export const createApplicationSchema = z.object({
  campaignId: z.string().cuid(),
  coverLetter: z.string().max(3000).optional(),
  priceInCents: z.number().int().min(100),
  estimatedDays: z.number().int().min(1).optional(),
});

export const createOfferSchema = z.object({
  applicationId: z.string().cuid(),
  priceInCents: z.number().int().min(100),
  message: z.string().max(2000).optional(),
  deliverables: z.array(z.string()).optional(),
  deadline: z.string().datetime().optional(),
});

export const respondOfferSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
});

// ============================================================================
// CHAT
// ============================================================================

export const sendMessageSchema = z.object({
  conversationId: z.string().cuid(),
  content: z.string().min(1).max(5000),
  attachmentUrl: z.string().url().optional(),
  attachmentName: z.string().max(255).optional(),
});

export const createConversationSchema = z.object({
  creatorId: z.string().cuid(),
  campaignId: z.string().cuid().optional(),
  initialMessage: z.string().min(1).max(5000).optional(),
});

// ============================================================================
// DELIVERABLES
// ============================================================================

export const submitDeliverableSchema = z.object({
  deliverableId: z.string().cuid(),
  fileUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional(),
  notes: z.string().max(2000).optional(),
}).refine(d => d.fileUrl || d.linkUrl, {
  message: 'Must provide either a file URL or link URL',
});

export const reviewDeliverableSchema = z.object({
  deliverableId: z.string().cuid(),
  approved: z.boolean(),
  feedback: z.string().max(2000).optional(),
});

// ============================================================================
// SEARCH
// ============================================================================

export const searchCreatorsSchema = z.object({
  query: z.string().max(200).optional(),
  categories: z.array(z.string()).optional(),
  platforms: z.array(z.enum(['TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'TWITTER', 'FACEBOOK', 'LINKEDIN'])).optional(),
  location: z.string().optional(),
  minFollowers: z.number().int().min(0).optional(),
  maxFollowers: z.number().int().optional(),
  minPrice: z.number().int().min(0).optional(),
  maxPrice: z.number().int().optional(),
  languages: z.array(z.string()).optional(),
  verifiedOnly: z.boolean().optional(),
  sortBy: z.enum(['relevance', 'followers', 'price_asc', 'price_desc', 'response_time']).default('relevance'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

// ============================================================================
// PAYMENTS
// ============================================================================

export const createPaymentSchema = z.object({
  contractId: z.string().cuid(),
});

export const webhookEventSchema = z.object({
  type: z.string(),
  data: z.object({
    object: z.record(z.unknown()),
  }),
});

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

export const createSubscriptionSchema = z.object({
  planTier: z.enum(['FREE', 'PRO', 'ENTERPRISE']),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
});

// ============================================================================
// ADMIN
// ============================================================================

export const verifyCreatorSchema = z.object({
  creatorId: z.string().cuid(),
  status: z.enum(['VERIFIED', 'REJECTED']),
  rejectionReason: z.string().max(500).optional(),
});

export const updateCommissionSchema = z.object({
  rate: z.number().min(0).max(0.5), // 0-50%
});

// ============================================================================
// PAGINATION
// ============================================================================

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateCreatorProfileInput = z.infer<typeof updateCreatorProfileSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type SearchCreatorsInput = z.infer<typeof searchCreatorsSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type VerifyCreatorInput = z.infer<typeof verifyCreatorSchema>;
