/**
 * Next.js cache helpers — keeps .next inside frontend/ (required for module resolution).
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const frontendDir = path.join(root, "frontend");
const frontendNextDir = path.join(frontendDir, ".next");

function getProjectDrive() {
  const match = /^([A-Za-z]:)/.exec(root);
  return match ? match[1].toUpperCase() : null;
}

function getDriveFreeBytes(driveLetter) {
  if (process.platform !== "win32" || !driveLetter) return null;

  try {
    const { execSync } = require("child_process");
    const out = execSync(
      `powershell -NoProfile -Command "(Get-PSDrive -Name '${driveLetter.replace(':', '')}' -PSProvider FileSystem).Free"`,
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    ).trim();
    const free = Number(out);
    return Number.isFinite(free) ? free : null;
  } catch {
    return null;
  }
}

function isReparsePoint(targetPath) {
  try {
    if (process.platform === "win32") {
      const lstat = fs.lstatSync(targetPath);
      return lstat.isSymbolicLink() || (lstat.mode & 0o170000) === 0o120000;
    }
    return fs.lstatSync(targetPath).isSymbolicLink();
  } catch {
    return false;
  }
}

function removePathIfExists(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  fs.rmSync(targetPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
}

/** Remove a junction/symlink .next — Next.js must use a real local folder. */
function restoreLocalNextCache() {
  if (!fs.existsSync(frontendNextDir)) return false;
  if (!isReparsePoint(frontendNextDir)) return false;
  fs.rmSync(frontendNextDir, { recursive: true, force: true });
  return true;
}

function cleanNextCache() {
  restoreLocalNextCache();
  removePathIfExists(frontendNextDir);
}

function formatBytes(bytes) {
  if (bytes === null) return "unknown";
  const gb = bytes / (1024 ** 3);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  return `${(bytes / (1024 ** 2)).toFixed(0)} MB`;
}

module.exports = {
  root,
  frontendDir,
  frontendNextDir,
  getProjectDrive,
  getDriveFreeBytes,
  restoreLocalNextCache,
  cleanNextCache,
  formatBytes,
  isReparsePoint,
};
