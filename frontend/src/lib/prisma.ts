import { PrismaClient } from "@prisma/client";

/**
 * Prisma singleton — prevents connection pool exhaustion in Next.js.
 *
 * Problem: Next.js hot-reload (dev) and serverless-style invocations can call
 * `new PrismaClient()` multiple times, quickly saturating the pool.
 *
 * Fix: Cache the instance on `globalThis` so every import reuses the same
 * client across the process lifetime. In production this is fine because the
 * Node.js process is long-lived; in dev, HMR preserves `globalThis` between
 * reloads so we also avoid leaks there.
 *
 * The `isPrismaClientCurrent` guard allows safe recreation after
 * `prisma generate` adds new models while the dev server is running.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function isPrismaClientCurrent(client: PrismaClient): boolean {
  // Re-create if newly generated models are missing from the cached instance.
  return (
    "admittedStudent" in client &&
    "studentMessageBroadcast" in client &&
    "lecturerMessageBroadcast" in client
  );
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;

  // Re-use cached instance if it is current (models match).
  if (cached && isPrismaClientCurrent(cached)) {
    return cached;
  }

  // Disconnect stale client before replacing it.
  if (cached) {
    void cached.$disconnect().catch(() => {});
  }

  const client = createPrismaClient();
  // Always cache — not just in dev — to prevent pool exhaustion.
  globalForPrisma.prisma = client;
  return client;
}

export const prisma = getPrismaClient();
