/**
 * Frees disk space by clearing Next.js dev/build cache.
 */
const {
  cleanNextCache,
  getDriveFreeBytes,
  getProjectDrive,
  formatBytes,
  frontendNextDir,
} = require("./next-cache-path");

const drive = getProjectDrive();
const before = getDriveFreeBytes(drive);

cleanNextCache();

const after = getDriveFreeBytes(drive);
console.log(`Cleared Next.js cache at ${frontendNextDir}`);
if (drive) {
  console.log(
    `Drive ${drive} free space: ${formatBytes(before)} -> ${formatBytes(after)}`
  );
}
