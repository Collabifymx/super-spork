import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.readReceipt.deleteMany();
  await prisma.conversationAssignment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.deliverableReview.deleteMany();
  await prisma.deliverableSubmission.deleteMany();
  await prisma.deliverable.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.payoutRecord.deleteMany();
  await prisma.paymentIntentRecord.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.application.deleteMany();
  await prisma.campaignAttachment.deleteMany();
  await prisma.campaignTargeting.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.shortlist.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.creatorRate.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.socialAccount.deleteMany();
  await prisma.creatorProfile.deleteMany();
  await prisma.brandMember.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash('Password123', 12);

  // ── Subscription Plans ─────────────────────────────────
  const freePlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Free',
      tier: 'FREE',
      priceMonthly: 0,
      priceYearly: 0,
      features: { maxCampaigns: 3, canMessage: false, canViewFullProposals: false, canShortlist: false, canContract: false, maxTeamMembers: 1 },
    },
  });

  const proPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Pro',
      tier: 'PRO',
      priceMonthly: 9900, // $99/mo
      priceYearly: 99000, // $990/yr
      features: { maxCampaigns: 50, canMessage: true, canViewFullProposals: true, canShortlist: true, canContract: true, maxTeamMembers: 10 },
    },
  });

  const enterprisePlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Enterprise',
      tier: 'ENTERPRISE',
      priceMonthly: 29900,
      priceYearly: 299000,
      features: { maxCampaigns: -1, canMessage: true, canViewFullProposals: true, canShortlist: true, canContract: true, maxTeamMembers: -1 },
    },
  });

  // ── Admin User ─────────────────────────────────────────
  await prisma.user.create({
    data: {
      email: 'admin@collabify.com',
      passwordHash: hash,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'Collabify',
      emailVerified: true,
    },
  });

  // ── Brand + Brand Members ──────────────────────────────
  const brandUser = await prisma.user.create({
    data: {
      email: 'brand@example.com',
      passwordHash: hash,
      role: 'BRAND',
      firstName: 'Evelyn',
      lastName: 'Munoz',
      emailVerified: true,
      avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Evelyn',
    },
  });

  const brand = await prisma.brand.create({
    data: {
      name: 'Glow Cosmetics',
      slug: 'glow-cosmetics',
      industry: 'Beauty & Cosmetics',
      website: 'https://glowcosmetics.example.com',
      size: 'medium',
      bio: 'Premium cosmetics brand looking for authentic influencer partnerships.',
    },
  });

  await prisma.brandMember.create({
    data: { brandId: brand.id, userId: brandUser.id, role: 'OWNER' },
  });

  // Pro subscription
  await prisma.subscription.create({
    data: {
      brandId: brand.id,
      planId: proPlan.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Second brand (free)
  const brandUser2 = await prisma.user.create({
    data: { email: 'brand2@example.com', passwordHash: hash, role: 'BRAND', firstName: 'Alex', lastName: 'Chen', emailVerified: true },
  });
  const brand2 = await prisma.brand.create({
    data: { name: 'TechStart', slug: 'techstart', industry: 'Technology', size: 'startup' },
  });
  await prisma.brandMember.create({ data: { brandId: brand2.id, userId: brandUser2.id, role: 'OWNER' } });
  await prisma.subscription.create({
    data: { brandId: brand2.id, planId: freePlan.id, status: 'ACTIVE', currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
  });

  // ── Creators ───────────────────────────────────────────
  const creators = [
    { firstName: 'Susan', lastName: 'Adams', email: 'susan@example.com', displayName: 'Susan Adams', slug: 'susan-adams', location: 'Barcelona, ESP', city: 'Barcelona', country: 'Spain', categories: ['Comedy'], totalFollowers: 870000, startingPrice: 520000, bio: 'Comedy creator based in Barcelona. Love making people laugh!' },
    { firstName: 'Tamara', lastName: 'Brown', email: 'tamara@example.com', displayName: 'Tamara Brown', slug: 'tamara-brown', location: 'Wellington, NZ', city: 'Wellington', country: 'New Zealand', categories: ['Lifestyle'], totalFollowers: 440000, startingPrice: 240000, bio: 'Lifestyle & wellness content creator from NZ.' },
    { firstName: 'Jay', lastName: 'Kellor', email: 'jay@example.com', displayName: 'Jay Kellor', slug: 'jay-kellor', location: 'New York, USA', city: 'New York', country: 'USA', categories: ['Fashion'], totalFollowers: 315000, startingPrice: 215000, bio: 'Fashion & street style from NYC.' },
    { firstName: 'Maria', lastName: 'Garcia', email: 'maria@example.com', displayName: 'Maria Garcia', slug: 'maria-garcia', location: 'Mexico City, MX', city: 'Mexico City', country: 'Mexico', categories: ['Beauty', 'Lifestyle'], totalFollowers: 520000, startingPrice: 180000, bio: 'Beauty tutorials and lifestyle content.' },
    { firstName: 'David', lastName: 'Kim', email: 'david@example.com', displayName: 'David Kim', slug: 'david-kim', location: 'Seoul, KR', city: 'Seoul', country: 'South Korea', categories: ['Tech', 'Gaming'], totalFollowers: 890000, startingPrice: 350000, bio: 'Tech reviews and gaming content.' },
    { firstName: 'Emma', lastName: 'Wilson', email: 'emma@example.com', displayName: 'Emma Wilson', slug: 'emma-wilson', location: 'London, UK', city: 'London', country: 'UK', categories: ['Travel', 'Food'], totalFollowers: 650000, startingPrice: 280000, bio: 'Exploring the world one plate at a time.' },
  ];

  const creatorProfiles = [];
  for (const c of creators) {
    const user = await prisma.user.create({
      data: {
        email: c.email,
        passwordHash: hash,
        role: 'CREATOR',
        firstName: c.firstName,
        lastName: c.lastName,
        emailVerified: true,
        avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${c.firstName}`,
      },
    });

    const profile = await prisma.creatorProfile.create({
      data: {
        userId: user.id,
        displayName: c.displayName,
        slug: c.slug,
        bio: c.bio,
        location: c.location,
        city: c.city,
        country: c.country,
        categories: c.categories,
        languages: ['English', 'Spanish'],
        totalFollowers: c.totalFollowers,
        startingPrice: c.startingPrice,
        isAvailable: true,
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        responseTimeHours: Math.floor(Math.random() * 24) + 1,
      },
    });

    // Add social accounts
    const platforms = ['TIKTOK', 'INSTAGRAM', 'YOUTUBE'] as const;
    for (const platform of platforms) {
      await prisma.socialAccount.create({
        data: {
          creatorId: profile.id,
          platform,
          handle: `@${c.slug}`,
          followers: Math.floor(c.totalFollowers / 3),
          avgViews: Math.floor(c.totalFollowers / 10),
          engagementRate: Math.random() * 5 + 1,
        },
      });
    }

    // Add rates
    await prisma.creatorRate.create({
      data: { creatorId: profile.id, platform: 'TIKTOK', deliverable: '1 TikTok Video', priceInCents: c.startingPrice },
    });
    await prisma.creatorRate.create({
      data: { creatorId: profile.id, platform: 'INSTAGRAM', deliverable: '1 Instagram Reel', priceInCents: Math.floor(c.startingPrice * 0.8) },
    });

    creatorProfiles.push(profile);
  }

  // ── Campaigns ──────────────────────────────────────────
  const campaign = await prisma.campaign.create({
    data: {
      brandId: brand.id,
      title: 'Summer Glow Collection Launch',
      slug: 'summer-glow-collection-launch',
      objective: 'Launch awareness for new Summer Glow collection',
      brief: 'We need authentic creators to showcase our new Summer Glow makeup collection. Looking for 30-60 second videos showing morning routines using our products. Must include product close-ups and natural lighting.',
      platforms: ['TIKTOK', 'INSTAGRAM'],
      deliverables: ['1 TikTok Video', '2 Instagram Stories'],
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      location: 'Worldwide',
      budgetMin: 200000,
      budgetMax: 500000,
      status: 'LIVE',
      targeting: {
        create: {
          minFollowers: 100000,
          categories: ['Beauty', 'Lifestyle', 'Fashion'],
          platforms: ['TIKTOK', 'INSTAGRAM'],
        },
      },
    },
  });

  const campaign2 = await prisma.campaign.create({
    data: {
      brandId: brand.id,
      title: 'Holiday Gift Guide',
      slug: 'holiday-gift-guide',
      objective: 'Create holiday gift guide content',
      brief: 'Create a holiday gift guide featuring our best sellers.',
      platforms: ['INSTAGRAM', 'YOUTUBE'],
      deliverables: ['1 YouTube Video', '3 Instagram Posts'],
      status: 'DRAFT',
      budgetMin: 300000,
      budgetMax: 800000,
    },
  });

  // ── Applications ───────────────────────────────────────
  const app1 = await prisma.application.create({
    data: {
      campaignId: campaign.id,
      creatorId: creatorProfiles[0].id,
      coverLetter: 'I would love to be part of the Summer Glow campaign! My audience loves beauty content and I have experience with cosmetics brands.',
      priceInCents: 450000,
      estimatedDays: 7,
      status: 'PENDING',
    },
  });

  const app2 = await prisma.application.create({
    data: {
      campaignId: campaign.id,
      creatorId: creatorProfiles[3].id,
      coverLetter: 'Beauty is my passion and I know my audience would love your products. Let me create something amazing!',
      priceInCents: 350000,
      estimatedDays: 5,
      status: 'SHORTLISTED',
    },
  });

  console.log('✅ Seed completed!');
  console.log('');
  console.log('📧 Test accounts:');
  console.log('  Admin: admin@collabify.com / Password123');
  console.log('  Brand (Pro): brand@example.com / Password123');
  console.log('  Brand (Free): brand2@example.com / Password123');
  console.log('  Creator: susan@example.com / Password123');
  console.log('  Creator: tamara@example.com / Password123');
  console.log('  Creator: jay@example.com / Password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
