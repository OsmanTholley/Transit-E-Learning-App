/**
 * Starts Prisma generate, the live classroom Socket.io server, and Next.js dev.
 */
const { spawnSync, spawn } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");

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

console.log("Starting live classroom Socket.io server...");
const socket = spawn("node", ["server/live-classroom-server.js"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

socket.on("error", (err) => {
  console.warn("Live classroom socket server failed to start:", err.message);
  console.warn("Run separately: npm run dev:socket\n");
});

console.log("Starting Next.js dev server...\n");
const dev = spawn("npm", ["run", "dev", "--prefix", "frontend"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

function shutdown() {
  socket.kill("SIGINT");
  dev.kill("SIGINT");
}

dev.on("exit", (code) => {
  socket.kill();
  process.exit(code ?? 0);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
