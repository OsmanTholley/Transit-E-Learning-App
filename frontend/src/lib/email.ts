import { randomUUID } from "crypto";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { Resend } from "resend";
import { buildTransactionalEmail, escapeHtml } from "@/lib/email-template";

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  category?: "transactional" | "announcement";
};

let transporter: Transporter | null = null;

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim() || "onboarding@resend.dev";
  if (!apiKey) return null;
  return { apiKey, from };
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.replace(/\s/g, "");
  const from = process.env.SMTP_FROM?.trim() || user;

  if (!host || !from) return null;

  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: user && pass ? { user, pass } : undefined,
    from,
    replyTo: user || from,
  };
}

function getPlatformName() {
  return process.env.PLATFORM_NAME?.trim() || "Transit E-Learning";
}

function buildEmailHeaders(input: SendEmailInput): Record<string, string> {
  const platform = getPlatformName();
  const headers: Record<string, string> = {
    "Message-ID": `<${randomUUID()}@${platform.toLowerCase().replace(/\s+/g, "-")}.mail>`,
    "X-Mailer": `${platform} Mailer`,
    "X-Priority": "3",
    Precedence: input.category === "announcement" ? "bulk" : "auto",
    "X-Auto-Response-Suppress": "All",
  };

  if (input.category === "transactional") {
    headers["X-Entity-Ref-ID"] = randomUUID();
  }

  return headers;
}

export function isEmailConfigured(): boolean {
  return getResendConfig() !== null || getSmtpConfig() !== null;
}

export function getEmailProvider(): "resend" | "smtp" | null {
  if (getResendConfig()) return "resend";
  if (getSmtpConfig()) return "smtp";
  return null;
}

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const config = getSmtpConfig();
  if (!config) return null;

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    pool: true,
    maxConnections: 3,
    tls: { minVersion: "TLSv1.2" },
  });

  return transporter;
}

export function getAppBaseUrl(requestOrigin?: string | null): string {
  const configured =
    process.env.APP_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (requestOrigin) return requestOrigin.replace(/\/$/, "");
  return "http://localhost:3000";
}

async function sendViaResend(
  config: { apiKey: string; from: string },
  input: SendEmailInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const resend = new Resend(config.apiKey);
    const { error } = await resend.emails.send({
      from: config.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html ?? input.text.replace(/\n/g, "<br>"),
      replyTo: input.replyTo,
      headers: buildEmailHeaders(input),
    });

    if (error) {
      console.error("[email] Resend send failed:", error);
      return { ok: false, error: error.message || "Failed to send email." };
    }

    return { ok: true };
  } catch (error) {
    console.error("[email] Resend send failed:", error);
    return { ok: false, error: "Failed to send email." };
  }
}

async function sendViaSmtp(input: SendEmailInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = getSmtpConfig();
  if (!config) {
    return { ok: false, error: "Email service is not configured." };
  }

  const mailer = getTransporter();
  if (!mailer) {
    return { ok: false, error: "Email service is not configured." };
  }

  try {
    await mailer.sendMail({
      from: config.from,
      to: input.to,
      replyTo: input.replyTo || config.replyTo,
      subject: input.subject,
      text: input.text,
      html: input.html ?? input.text.replace(/\n/g, "<br>"),
      headers: buildEmailHeaders(input),
    });
    return { ok: true };
  } catch (error) {
    console.error("[email] SMTP send failed:", error);
    return { ok: false, error: "Failed to send email." };
  }
}

export async function sendEmail(input: SendEmailInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const resendConfig = getResendConfig();
  if (resendConfig) {
    return sendViaResend(resendConfig, input);
  }

  const smtpConfig = getSmtpConfig();
  if (!smtpConfig) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[email] No email provider configured — would send:", {
        to: input.to,
        subject: input.subject,
        text: input.text,
      });
      return { ok: true };
    }
    return { ok: false, error: "Email service is not configured." };
  }

  return sendViaSmtp(input);
}

export async function sendPasswordResetOtpEmail(params: {
  to: string;
  fullName: string;
  otp: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const platformName = getPlatformName();
  const subject = `${platformName} — Your password reset code`;
  const { html, text } = buildTransactionalEmail({
    platformName,
    previewText: `Your password reset code is ${params.otp}. It expires in 15 minutes.`,
    heading: "Password reset code",
    bodyHtml: `
      <p>Hello ${escapeHtml(params.fullName)},</p>
      <p>We received a request to reset your password. Use the code below on the reset password page.</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:20px 0;color:#1e3a8a;">${escapeHtml(params.otp)}</p>
      <p>This code expires in <strong>15 minutes</strong>. If you did not request a reset, you can safely ignore this email.</p>
    `,
    footerNote: "This is an automated security message. Please do not reply.",
  });

  return sendEmail({
    to: params.to,
    subject,
    text,
    html,
    category: "transactional",
  });
}

export async function sendLecturerInviteEmail(params: {
  to: string;
  fullName: string;
  temporaryPassword: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const platformName = getPlatformName();
  const loginUrl = `${getAppBaseUrl()}/login?role=staff`;
  const subject = `${platformName} — Your lecturer account is ready`;
  const { html, text } = buildTransactionalEmail({
    platformName,
    previewText: `Welcome to ${platformName}. Sign in with your email and temporary password.`,
    heading: "Welcome to the staff portal",
    bodyHtml: `
      <p>Hello <strong>${escapeHtml(params.fullName)}</strong>,</p>
      <p>An administrator has created your lecturer account on <strong>${escapeHtml(platformName)}</strong>.</p>
      <p>Use the credentials below to sign in. We recommend changing your password after your first login.</p>
      <table style="margin:16px 0;border-collapse:collapse;width:100%;max-width:420px;">
        <tr><td style="padding:8px 0;color:#64748b;">Email</td><td style="padding:8px 0;"><strong>${escapeHtml(params.to)}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Temporary password</td><td style="padding:8px 0;"><strong>${escapeHtml(params.temporaryPassword)}</strong></td></tr>
      </table>
      <p><a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#1e3a8a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Sign in to staff portal</a></p>
      <p style="font-size:13px;color:#64748b;">Portal link: ${escapeHtml(loginUrl)}</p>
    `,
    footerNote: "If you did not expect this email, contact your institution administrator.",
  });

  return sendEmail({
    to: params.to,
    subject,
    text: [
      `Hello ${params.fullName},`,
      `Your lecturer account on ${platformName} is ready.`,
      `Email: ${params.to}`,
      `Temporary password: ${params.temporaryPassword}`,
      `Sign in: ${loginUrl}`,
    ].join("\n"),
    html,
    category: "transactional",
  });
}

export async function sendPaymentReceiptEmail(params: {
  to: string;
  fullName: string;
  amountPaid: string;
  remainingBalance: string;
  receiptNumber: string;
  feeTitle: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const platformName = getPlatformName();
  const subject = `${platformName} — Payment receipt ${params.receiptNumber}`;
  const { html, text } = buildTransactionalEmail({
    platformName,
    previewText: `Thank you, ${params.fullName}. We received ${params.amountPaid}. Your remaining balance is ${params.remainingBalance}.`,
    heading: "Payment received",
    bodyHtml: `
      <p>Thank you, <strong>${escapeHtml(params.fullName)}</strong>.</p>
      <p>We received <strong>${escapeHtml(params.amountPaid)}</strong> for <strong>${escapeHtml(params.feeTitle)}</strong>.</p>
      <p>Receipt number: <strong>${escapeHtml(params.receiptNumber)}</strong></p>
      <p>Your current remaining balance is <strong>${escapeHtml(params.remainingBalance)}</strong>.</p>
    `,
    footerNote: "Keep this email for your records.",
  });

  return sendEmail({
    to: params.to,
    subject,
    text: [
      `Thank you, ${params.fullName}.`,
      `We received ${params.amountPaid} for ${params.feeTitle}.`,
      `Receipt: ${params.receiptNumber}`,
      `Remaining balance: ${params.remainingBalance}`,
    ].join("\n"),
    html,
    category: "transactional",
  });
}

export async function sendAnnouncementEmail(params: {
  to: string;
  fullName: string;
  title: string;
  message: string;
  portalLabel: string;
}): Promise<void> {
  const platformName = getPlatformName();
  const subject = `${platformName} — ${params.title}`;
  const { html, text } = buildTransactionalEmail({
    platformName,
    previewText: `${params.title}: ${params.message.slice(0, 120)}`,
    heading: params.title,
    bodyHtml: `
      <p>Hello ${escapeHtml(params.fullName)},</p>
      <p><strong>${escapeHtml(params.portalLabel)}</strong> announcement:</p>
      <p>${escapeHtml(params.message).replace(/\n/g, "<br>")}</p>
    `,
  });

  const result = await sendEmail({ to: params.to, subject, text, html, category: "announcement" });
  if (!result.ok) {
    console.error(`[email] announcement to ${params.to} failed:`, result.error);
  }
}
