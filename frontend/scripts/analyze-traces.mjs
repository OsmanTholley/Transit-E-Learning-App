import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverDir = path.join(frontendDir, ".next", "server");

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name.endsWith(".nft.json")) out.push(p);
  }
  return out;
}

const files = walk(serverDir);
const rows = [];

for (const nftPath of files) {
  const data = JSON.parse(fs.readFileSync(nftPath, "utf8"));
  const traced = data.files || [];
  const nftDir = path.dirname(nftPath);
  let total = 0;
  const byDir = {};

  for (const rel of traced) {
    const abs = path.resolve(nftDir, rel);
    try {
      const st = fs.statSync(abs);
      total += st.size;
      const key = rel.replace(/\\/g, "/").split("/").slice(0, 5).join("/");
      byDir[key] = (byDir[key] || 0) + st.size;
    } catch {
      // ignore
    }
  }

  rows.push({
    file: path.relative(serverDir, nftPath).replace(/\.nft\.json$/, ""),
    totalMB: total / 1024 / 1024,
    files: traced.length,
    top: Object.entries(byDir)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8),
  });
}

rows.sort((a, b) => b.totalMB - a.totalMB);
console.log("Top 25 largest function traces:\n");
for (const r of rows.slice(0, 25)) {
  console.log(`${r.totalMB.toFixed(1)} MB | ${r.files} files | ${r.file}`);
  for (const [k, v] of r.top) {
    console.log(`    ${(v / 1024 / 1024).toFixed(1)} MB  ${k}`);
  }
  console.log();
}
