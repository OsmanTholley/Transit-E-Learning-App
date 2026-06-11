/**
 * Starts the Next.js dev server. Runs prisma generate first when possible;
 * on Windows EPERM (file locked by another node process), continues anyway.
 */
const { spawnSync, spawn } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");

if (process.env.PRISMA_GENERATE_ON_DEV === "1") {
  console.log("Checking Prisma client...");
  const gen = spawnSync("npx", ["prisma", "generate"], {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });

  if (gen.status !== 0) {
    console.warn("\nPrisma generate skipped or failed.");
    console.warn("This is normal on Windows if another dev server is already running.");
    console.warn("Stop other Node processes, or run: npm run db:generate\n");
  }
}

console.log("Starting Transit dev server (Next.js + Socket.IO)...\n");
const dev = spawn("node", ["server.js"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NODE_ENV: "development" },
});

dev.on("exit", (code) => process.exit(code ?? 0));

process.on("SIGINT", () => dev.kill("SIGINT"));
process.on("SIGTERM", () => dev.kill("SIGTERM"));
