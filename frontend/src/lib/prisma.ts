import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient();
}

function isPrismaClientCurrent(client: PrismaClient) {
  return (
    "admittedStudent" in client &&
    "studentMessageBroadcast" in client &&
    "lecturerMessageBroadcast" in client
  );
}

function getPrismaClient() {
  const cached = globalForPrisma.prisma;
  // Recreate after `prisma generate` adds new models while the dev server is running.
  if (cached && isPrismaClientCurrent(cached)) {
    return cached;
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = getPrismaClient();
