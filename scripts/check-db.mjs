import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "../frontend/node_modules/@prisma/client/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env") });

const url = process.env.DATABASE_URL ?? "";
const host = url.includes("neon.tech")
  ? "neon.tech"
  : url.includes("prisma.io")
    ? "prisma.io"
    : "unknown";

console.log(`DATABASE_URL host: ${host}`);

const prisma = new PrismaClient();
try {
  await prisma.$queryRaw`SELECT 1 AS ok`;
  const tables = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  console.log("DB: CONNECTED");
  console.log(`Tables (${tables.length}):`, tables.map((t) => t.table_name).join(", "));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("DB: FAILED -", message.split("\n")[0]);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
