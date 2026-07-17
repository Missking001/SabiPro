import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient {
    private readonly logger;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
