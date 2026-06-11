/**
 * Starts the Next.js dev server. Runs prisma generate first when possible;
 * on Windows EPERM (file locked by another node process), continues anyway.
 */
const { spawnSync, spawn } = require("child_process");
const path = require("path");
const {
  restoreLocalNextCache,
  getDriveFreeBytes,
  getProjectDrive,
  formatBytes,
} = require("./next-cache-path");

const root = path.resolve(__dirname, "..");
const projectDrive = getProjectDrive();
const freeBefore = getDriveFreeBytes(projectDrive);

if (restoreLocalNextCache()) {
  console.warn(
    "Removed off-drive .next junction — cache must stay in frontend/ for module resolution.\n"
  );
}

if (freeBefore !== null && freeBefore < 512 * 1024 * 1024) {
  console.warn(
    `\nLow disk space on ${projectDrive} (${formatBytes(freeBefore)} free). Clearing Next.js cache...\n`
  );
  require("./clean-dev-cache");
} else if (projectDrive && freeBefore !== null && freeBefore < 1024 * 1024 * 1024) {
  console.warn(
    `Note: ${projectDrive} has ${formatBytes(freeBefore)} free. Run npm run dev:clean if dev gets slow.\n`
  );
}

if (process.env.PRISMA_GENERATE_ON_DEV === "1") {
  console.log("Checking Prisma client...");
  const prismaCli = path.join(root, "node_modules", "prisma", "build", "index.js");
  const gen = spawnSync(process.execPath, [prismaCli, "generate"], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });

  if (gen.status !== 0) {
    console.warn("\nPrisma generate skipped or failed.");
    console.warn("This is normal on Windows if another dev server is already running.");
    console.warn("Stop other Node processes, or run: npm run db:generate\n");
  }
}

console.log("Starting Transit dev server (Next.js + Socket.IO)...\n");
const dev = spawn(process.execPath, [path.join(root, "server.js")], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "development" },
});

dev.on("exit", (code) => process.exit(code ?? 0));

process.on("SIGINT", () => dev.kill("SIGINT"));
process.on("SIGTERM", () => dev.kill("SIGTERM"));
