import { PrismaClient, Role, OnboardingState } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  const adminEmail = 'admin@sabipro.com';
  const consumerEmail = 'chioma@sabipro.com';
  const providerEmail = 'emeka@sabipro.com';

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existingAdmin) {
    console.log('Seed data already exists, skipping.');
    return;
  }

  const password = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: adminEmail,
      password,
      role: Role.ADMIN,
      isVerified: true,
      isActive: true,
    },
  });
  console.log(`Admin created: ${admin.email}`);

  const consumer = await prisma.user.create({
    data: {
      name: 'Chioma Okafor',
      email: consumerEmail,
      password,
      role: Role.CONSUMER,
      isVerified: true,
      isActive: true,
    },
  });
  console.log(`Consumer created: ${consumer.email}`);

  const providerUser = await prisma.user.create({
    data: {
      name: 'Emeka Nwosu',
      email: providerEmail,
      password,
      role: Role.PROVIDER,
      isVerified: true,
      isActive: true,
    },
  });
  console.log(`Provider user created: ${providerUser.email}`);

  const provider = await prisma.provider.create({
    data: {
      userId: providerUser.id,
      slug: 'plumber-surulere-abc123',
      tradeCategory: 'Plumbing',
      location: 'Surulere, Lagos',
      bio: 'Experienced plumber with over 10 years in residential and commercial plumbing. Specializing in pipe repairs, installations, and water heater services.',
      priceRange: '\u20A65,000 - \u20A650,000',
      isAvailable: true,
      onboardingState: OnboardingState.ACTIVE,
      averageRating: 4.5,
      totalReviews: 12,
    },
  });
  console.log(`Provider created: ${provider.slug}`);

  const review1 = await prisma.review.create({
    data: {
      consumerId: consumer.id,
      providerId: provider.id,
      rating: 5,
      comment: 'Emeka did an excellent job fixing our bathroom pipes. Very professional and punctual.',
      isVisible: true,
    },
  });
  console.log(`Review created: ${review1.id}`);

  const secondConsumer = await prisma.user.create({
    data: {
      name: 'Tunde Bakare',
      email: 'tunde@sabipro.com',
      password,
      role: Role.CONSUMER,
      isVerified: true,
    },
  });

  const review2 = await prisma.review.create({
    data: {
      consumerId: secondConsumer.id,
      providerId: provider.id,
      rating: 4,
      comment: 'Good work but took a bit longer than expected.',
      isVisible: true,
    },
  });

  const inquiry = await prisma.inquiry.create({
    data: {
      consumerId: consumer.id,
      providerId: provider.id,
      message: 'Hi Emeka, I need someone to fix a leaking pipe in my kitchen. Are you available this weekend?',
      status: 'PENDING',
    },
  });
  console.log(`Inquiry created: ${inquiry.id}`);

  console.log('\nSeed completed!');
  console.log('Login credentials (all users): Password123!');
  console.log(`Admin:    ${adminEmail}`);
  console.log(`Consumer: ${consumerEmail}`);
  console.log(`Provider: ${providerEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
