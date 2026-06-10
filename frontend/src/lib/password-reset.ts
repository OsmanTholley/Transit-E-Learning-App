import { createHash, randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/activity-log";
import { isEmailConfigured, sendPasswordResetOtpEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const OTP_TTL_MS = 15 * 60 * 1000;

function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

function generateOtp(): string {
  return String(randomInt(100000, 1000000));
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return { error: "Email is required." as const };
  }

  if (!isEmailConfigured() && process.env.NODE_ENV === "production") {
    return { error: "Password reset is not available right now. Please contact support." as const };
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, fullName: true, email: true, isActive: true },
  });

  if (!user?.email || !user.isActive) {
    return { message: otpSentMessage(), email: normalizedEmail };
  }

  const otp = generateOtp();
  const tokenHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    }),
  ]);

  const sent = await sendPasswordResetOtpEmail({
    to: user.email,
    fullName: user.fullName,
    otp,
  });

  if (!sent.ok) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[password-reset] Email delivery failed — OTP for ${user.email} (development only): ${otp}`,
      );
      return { message: otpSentMessage(), email: normalizedEmail };
    }
    return { error: "Unable to send reset email. Please try again later." as const };
  }

  await logActivity({
    actorId: user.id,
    action: "auth.password_reset_requested",
    entityType: "user",
    entityId: user.id,
    summary: `${user.fullName} requested a password reset OTP`,
  });

  return { message: otpSentMessage(), email: normalizedEmail };
}

export async function resetPasswordWithOtp(email: string, otp: string, newPassword: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedOtp = otp.trim().replace(/\s/g, "");

  if (!normalizedEmail) {
    return { error: "Email is required." as const };
  }
  if (!/^\d{6}$/.test(normalizedOtp)) {
    return { error: "Enter the 6-digit OTP code from your email." as const };
  }

  const trimmed = newPassword.trim();
  if (!trimmed || trimmed.length < 8) {
    return { error: "Password must be at least 8 characters." as const };
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, fullName: true, isActive: true },
  });

  if (!user?.isActive) {
    return { error: "Invalid OTP or email. Request a new code." as const };
  }

  const tokenHash = hashOtp(normalizedOtp);
  const record = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) {
    return { error: "Invalid or expired OTP. Request a new code." as const };
  }

  const passwordHash = await bcrypt.hash(trimmed, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  await logActivity({
    actorId: user.id,
    action: "auth.password_reset_completed",
    entityType: "user",
    entityId: user.id,
    summary: `${user.fullName} reset their password with OTP`,
  });

  return { message: "Password reset successfully. You can now sign in." as const };
}

function otpSentMessage() {
  return "A 6-digit OTP code has been sent to your email. Check your inbox to reset your password.";
}
