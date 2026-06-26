import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { sendSMS, decryptApiKey } from "@/lib/sms";
import { normalizePhone } from "@/lib/courier-fraud";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "bizilcore-guest-otp-secret"
);

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendGuestCheckoutOtp(shopId: string, phone: string, userId: string | null) {
  const normalized = normalizePhone(phone);
  if (normalized.length < 11) throw new Error("Valid phone required");

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.storeCheckoutOtp.deleteMany({ where: { shopId, phone: normalized } });
  await prisma.storeCheckoutOtp.create({
    data: { shopId, phone: normalized, otp, expiresAt },
  });

  if (userId) {
    const smsSettings = await prisma.smsSettings.findUnique({ where: { userId } });
    if (smsSettings?.isConnected && smsSettings.apiKey) {
      const apiKey = decryptApiKey(smsSettings.apiKey);
      await sendSMS(apiKey, normalized, `আপনার OTP: ${otp}\n১০ মিনিটের মধ্যে ব্যবহার করুন।`);
    }
  }

  return { sent: true, devOtp: process.env.NODE_ENV === "development" ? otp : undefined };
}

export async function verifyGuestCheckoutOtp(shopId: string, phone: string, otp: string) {
  const normalized = normalizePhone(phone);
  const record = await prisma.storeCheckoutOtp.findFirst({
    where: { shopId, phone: normalized, verified: false },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.expiresAt < new Date()) {
    throw new Error("OTP expired or not found");
  }
  if (record.otp !== otp.trim()) {
    throw new Error("Invalid OTP");
  }

  await prisma.storeCheckoutOtp.update({ where: { id: record.id }, data: { verified: true } });

  const token = await new SignJWT({ shopId, phone: normalized })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30m")
    .setIssuedAt()
    .sign(SECRET);

  return { token };
}

export async function verifyGuestOtpToken(shopId: string, phone: string, token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.shopId === shopId && payload.phone === normalizePhone(phone);
  } catch {
    return false;
  }
}
