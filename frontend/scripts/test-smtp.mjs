import dotenv from "dotenv";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

const rootEnv = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env");
dotenv.config({ path: rootEnv, override: true });

const user = process.env.SMTP_USER?.trim();
const pass = process.env.SMTP_PASS?.replace(/\s/g, "");
const host = process.env.SMTP_HOST?.trim();
const port = Number(process.env.SMTP_PORT ?? "587");
const from = process.env.SMTP_FROM?.trim() || user;
const sendTo = process.argv[2]?.trim();
const platformName = process.env.PLATFORM_NAME?.trim() || "Transit E-Learning";

if (!host || !user || !pass) {
  console.error("Missing SMTP_HOST, SMTP_USER, or SMTP_PASS in root .env");
  process.exit(1);
}

const secure = process.env.SMTP_SECURE === "true" || port === 465;

console.log(`Testing SMTP: ${user} @ ${host}:${port} (secure: ${secure})`);

const transport = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
});

try {
  await transport.verify();
  console.log("SMTP OK — credentials are valid.");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("SMTP FAILED:", message);
  if (message.includes("BadCredentials") || message.includes("535")) {
    console.error("\nGmail fix:");
    console.error("  1. SMTP_USER must be your real Gmail address (e.g. you@gmail.com)");
    console.error("  2. Enable 2-Step Verification on that Google account");
    console.error("  3. Create a new App Password: https://myaccount.google.com/apppasswords");
    console.error("  4. Put the 16-character password in SMTP_PASS (spaces are OK)");
  }
  process.exit(1);
}

if (!sendTo) {
  console.log("\nTo send a test email, run:");
  console.log("  npm run test:smtp -- you@example.com");
  process.exit(0);
}

try {
  const info = await transport.sendMail({
    from,
    to: sendTo,
    subject: `${platformName} — SMTP test message`,
    text: [
      `Hello,`,
      "",
      `This is a test email from ${platformName}.`,
      `If you received this, SMTP is configured correctly on port ${port}.`,
      "",
      `— ${platformName}`,
    ].join("\n"),
    html: `
      <p>Hello,</p>
      <p>This is a test email from <strong>${platformName}</strong>.</p>
      <p>If you received this, SMTP is configured correctly on port ${port}.</p>
      <p>— ${platformName}</p>
    `.trim(),
  });

  console.log(`\nTest email sent to ${sendTo}`);
  console.log("Message ID:", info.messageId);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Send failed:", message);
  process.exit(1);
}
