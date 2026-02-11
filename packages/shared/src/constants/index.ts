// Feature gates per plan
export const PLAN_FEATURES = {
  FREE: {
    maxCampaigns: 3,
    canMessage: false,
    canViewFullProposals: false,
    canShortlist: false,
    canContract: false,
    maxTeamMembers: 1,
  },
  PRO: {
    maxCampaigns: 50,
    canMessage: true,
    canViewFullProposals: true,
    canShortlist: true,
    canContract: true,
    maxTeamMembers: 10,
  },
  ENTERPRISE: {
    maxCampaigns: -1, // unlimited
    canMessage: true,
    canViewFullProposals: true,
    canShortlist: true,
    canContract: true,
    maxTeamMembers: -1,
  },
} as const;

export const DEFAULT_COMMISSION_RATE = 0.15; // 15%

export const CREATOR_CATEGORIES = [
  'Fashion', 'Beauty', 'Fitness', 'Travel', 'Food',
  'Tech', 'Gaming', 'Lifestyle', 'Comedy', 'Education',
  'Music', 'Art', 'Photography', 'Health', 'Finance',
  'Parenting', 'Pets', 'Sports', 'Automotive', 'Home & Garden',
] as const;

export const SOCIAL_PLATFORMS = [
  'TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'TWITTER', 'FACEBOOK', 'LINKEDIN',
] as const;

export const APPLICATION_STATE_MACHINE: Record<string, string[]> = {
  PENDING: ['SHORTLISTED', 'REJECTED', 'WITHDRAWN'],
  SHORTLISTED: ['OFFERED', 'REJECTED', 'WITHDRAWN'],
  OFFERED: ['ACCEPTED', 'REJECTED', 'COUNTER_OFFERED', 'WITHDRAWN'],
  COUNTER_OFFERED: ['OFFERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
  ACCEPTED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

export const CONTRACT_STATE_MACHINE: Record<string, string[]> = {
  ACTIVE: ['DELIVERING', 'CANCELLED'],
  DELIVERING: ['IN_REVIEW', 'CANCELLED'],
  IN_REVIEW: ['COMPLETED', 'DELIVERING', 'DISPUTED'],
  COMPLETED: [],
  CANCELLED: [],
  DISPUTED: ['COMPLETED', 'CANCELLED'],
};

export const CAMPAIGN_STATE_MACHINE: Record<string, string[]> = {
  DRAFT: ['LIVE'],
  LIVE: ['PAUSED', 'CLOSED'],
  PAUSED: ['LIVE', 'CLOSED'],
  CLOSED: [],
};
