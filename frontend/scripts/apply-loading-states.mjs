import fs from "fs";
import path from "path";

const root = path.resolve("src");

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory() && ent.name !== "node_modules" && ent.name !== ".next") walk(p, files);
    else if (ent.isFile() && (ent.name.endsWith(".tsx") || ent.name.endsWith(".ts"))) files.push(p);
  }
  return files;
}

const importLine = 'import { LoadingState } from "@/components/ui/loading-indicator";';

const skipFiles = new Set([path.normalize(path.join(root, "components/ui/loading-indicator.tsx"))]);

let updated = 0;
for (const file of walk(root)) {
  if (skipFiles.has(path.normalize(file))) continue;
  let src = fs.readFileSync(file, "utf8");
  const orig = src;
  if (!/Loading/.test(src)) continue;

  src = src.replace(
    /<div className="flex min-h-\[200px\] items-center justify-center rounded-2xl border border-slate-200\/80 bg-white p-8(?: shadow-sm)?">\s*<p className="text-sm text-slate-500">([^<]+)<\/p>\s*<\/div>/g,
    (_, msg) => `<LoadingState message="${msg.trim()}" panel minHeight={200} />`,
  );

  src = src.replace(
    /<div className="flex min-h-\[320px\] items-center justify-center rounded-2xl border border-slate-200\/80 bg-white(?: shadow-sm)?">\s*<p className="text-sm text-slate-500">([^<]+)<\/p>\s*<\/div>/g,
    (_, msg) => `<LoadingState message="${msg.trim()}" panel minHeight={320} />`,
  );

  src = src.replace(
    /<p className="px-4 py-6 text-center text-sm text-slate-500">([^<]+)<\/p>/g,
    (_, msg) => `<LoadingState message="${msg.trim()}" layout="compact" />`,
  );

  src = src.replace(
    /return <p className="text-sm text-slate-500">([^<]+)<\/p>;/g,
    (_, msg) => `return <LoadingState message="${msg.trim()}" layout="inline" />;`,
  );

  src = src.replace(
    /return \(\s*<p className="text-sm text-slate-500">([^<]+)<\/p>\s*\);/g,
    (_, msg) => `return <LoadingState message="${msg.trim()}" layout="inline" />;`,
  );

  src = src.replace(
    /fallback=\{<p className="text-sm text-slate-500">([^<]+)<\/p>\}/g,
    (_, msg) => `fallback={<LoadingState message="${msg.trim()}" layout="inline" />}`,
  );

  src = src.replace(
    /if \(loading\) return <p className="text-sm text-slate-500">([^<]+)<\/p>;/g,
    (_, msg) => `if (loading) return <LoadingState message="${msg.trim()}" layout="inline" />;`,
  );

  src = src.replace(
    /<p className="p-5 text-sm text-slate-500">([^<]+)<\/p>/g,
    (_, msg) => `<LoadingState message="${msg.trim()}" layout="compact" className="p-5" />`,
  );

  src = src.replace(
    /<p className="p-4 text-sm text-slate-500">([^<]+)<\/p>/g,
    (_, msg) => `<LoadingState message="${msg.trim()}" layout="compact" className="p-4" />`,
  );

  src = src.replace(
    /<p className="p-6 text-sm text-slate-500">([^<]+)<\/p>/g,
    (_, msg) => `<LoadingState message="${msg.trim()}" layout="compact" className="p-6" />`,
  );

  src = src.replace(
    /\{loading \? \(\s*<p className="text-sm text-slate-500">([^<]+)<\/p>\s*\)/g,
    (_, msg) => `{loading ? (\n        <LoadingState message="${msg.trim()}" layout="inline" />\n      )`,
  );

  src = src.replace(
    /<div className="rounded-2xl border border-slate-200\/80 bg-white p-8">\s*<p className="text-sm text-slate-500">([^<]+)<\/p>\s*<\/div>/g,
    (_, msg) => `<LoadingState message="${msg.trim()}" panel minHeight={160} />`,
  );

  src = src.replace(
    /<td colSpan=\{(\d+)\} className="px-3 py-6 text-center text-sm text-slate-500">\s*([^<]+)\s*<\/td>/g,
    (_, span, msg) =>
      `<td colSpan={${span}} className="px-3 py-6">\n                <LoadingState message="${msg.trim()}" layout="compact" />\n              </td>`,
  );

  src = src.replace(
    /<p className="text-sm text-slate-500">([^<]+)<\/p>/g,
    (_, msg) => {
      if (!/Loading/i.test(msg)) return `<p className="text-sm text-slate-500">${msg}</p>`;
      return `<LoadingState message="${msg.trim()}" layout="inline" />`;
    },
  );

  if (src !== orig && src.includes("LoadingState")) {
    if (!src.includes(importLine)) {
      if (src.startsWith('"use client"')) {
        src = src.replace(/^"use client";\r?\n/, (m) => `${m}${importLine}\n`);
      } else if (src.startsWith("import ")) {
        src = `${importLine}\n${src}`;
      } else {
        src = `${importLine}\n${src}`;
      }
    }
    fs.writeFileSync(file, src);
    updated++;
    console.log("updated:", path.relative(root, file));
  }
}

console.log("Total updated:", updated);
