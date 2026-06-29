import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function isDatabaseConfigured() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return false;

  try {
    const parsedUrl = new URL(databaseUrl);
    const databaseName = parsedUrl.pathname.replace(/^\/+/, '').toLowerCase();

    return (
      parsedUrl.hostname.toLowerCase() !== 'host' &&
      parsedUrl.username.toLowerCase() !== 'user' &&
      parsedUrl.password.toLowerCase() !== 'password' &&
      databaseName !== 'database' &&
      databaseName.length > 0
    );
  } catch {
    return false;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
