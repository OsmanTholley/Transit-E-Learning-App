import type { NextConfig } from "next";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(configDir, "../.env");
dotenv.config({ path: rootEnvPath });

const nextConfig: NextConfig = {
  // Root .env is canonical — avoids stale overrides in frontend/.env
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM: process.env.RESEND_FROM,
    APP_BASE_URL: process.env.APP_BASE_URL,
    PLATFORM_NAME: process.env.PLATFORM_NAME,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    JITSI_DOMAIN: process.env.JITSI_DOMAIN,
  },
  turbopack: {
    root: configDir,
  },
  outputFileTracingRoot: configDir,
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  experimental: {
    proxyClientMaxBodySize: 500 * 1024 * 1024,
  },
};

export default nextConfig;
