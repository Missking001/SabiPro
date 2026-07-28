import { PrismaClient, OnboardingState } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  const result = await prisma.provider.updateMany({
    where: {
      onboardingState: OnboardingState.PROFILE_COMPLETE,
    },
    data: {
      onboardingState: OnboardingState.ACTIVE,
    },
  });

  console.log(`Updated ${result.count} providers from PROFILE_COMPLETE to ACTIVE`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
