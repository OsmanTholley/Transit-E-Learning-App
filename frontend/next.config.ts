import type { NextConfig } from "next";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const configDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(configDir, "../.env") });

const nextConfig: NextConfig = {
  turbopack: {
    root: configDir,
  },
  outputFileTracingRoot: configDir,
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
