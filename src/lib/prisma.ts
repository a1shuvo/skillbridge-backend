import { PrismaClient } from "@prisma/client"; // Standard import
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in your environment variables.");
}

// 1. Create a pg Pool (Required for the adapter)
const pool = new pg.Pool({ connectionString });

// 2. Initialize the Adapter
const adapter = new PrismaPg(pool);

// 3. Prevent multiple instances in development (Singleton)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ 
    adapter,
    // Optional: Log queries in development mode
    // log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;