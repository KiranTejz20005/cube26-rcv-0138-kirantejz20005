import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const customUrl = process.env.DATABASE_URL;
  let dbUrl: string | undefined = undefined;

  // On Vercel serverless runtime (API routes / SSR), SQLite database must reside in /tmp to enable write operations.
  // During build phase or CLI scripts, standard SQLite file path is used.
  const isVercelRuntime = Boolean(process.env.VERCEL && (process.env.NEXT_RUNTIME || process.env.NOW_REGION));

  if (isVercelRuntime) {
    try {
      const tmpDbPath = '/tmp/dev.db';
      if (!fs.existsSync(tmpDbPath)) {
        const rootDb = path.join(process.cwd(), 'dev.db');
        const prismaDb = path.join(process.cwd(), 'prisma', 'dev.db');
        const source = fs.existsSync(rootDb) ? rootDb : fs.existsSync(prismaDb) ? prismaDb : null;

        if (source) {
          fs.copyFileSync(source, tmpDbPath);
        }
      }

      if (fs.existsSync(tmpDbPath)) {
        dbUrl = `file:${tmpDbPath}`;
      }
    } catch (err) {
      console.warn('Failed to configure /tmp SQLite writable database:', err);
    }
  }

  return new PrismaClient({
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {}),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

