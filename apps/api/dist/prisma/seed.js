"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient({
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
            role: client_1.Role.ADMIN,
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
            role: client_1.Role.CONSUMER,
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
            role: client_1.Role.PROVIDER,
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
            onboardingState: client_1.OnboardingState.ACTIVE,
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
            role: client_1.Role.CONSUMER,
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
//# sourceMappingURL=seed.js.map