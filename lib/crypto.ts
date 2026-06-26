/**
 * Shared crypto utilities for the Integrations module.
 *
 * - encryptToken / decryptToken: AES-256-GCM for social access tokens
 *   (SocialConnection.accessToken). Format: "v1:<ivB64>:<tagB64>:<cipherB64>"
 * - signState / verifyState: HMAC-SHA256-signed OAuth `state` payload
 *   to prevent CSRF and carry shopId through the redirect.
 *
 * Note: legacy lib/whatsapp.ts + lib/sms.ts use AES-256-CBC for older data —
 * those stay as-is. New code should use these helpers.
 */
import crypto from "crypto";

function getEncryptionKey(): Buffer {
  const raw = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;
  if (raw) {
    // Accept 64-char hex, base64, or any string (hashed to 32 bytes)
    if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
    try {
      const b64 = Buffer.from(raw, "base64");
      if (b64.length === 32) return b64;
    } catch {
      /* fall through */
    }
    return crypto.createHash("sha256").update(raw).digest();
  }
  // Dev fallback so the feature works before the key is configured
  const secret =
    process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "bizilcore-social-fallback-key";
  return crypto.createHash("sha256").update("social:" + secret).digest();
}

export function encryptToken(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptToken(encrypted: string): string {
  try {
    const [version, ivB64, tagB64, dataB64] = encrypted.split(":");
    if (version !== "v1") return "";
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      getEncryptionKey(),
      Buffer.from(ivB64, "base64"),
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return "";
  }
}

// ── OAuth state (CSRF protection) ─────────────────────────────────

export interface OAuthState {
  shopId: string;
  platform: "facebook" | "instagram" | "whatsapp";
  nonce: string;
  exp: number; // unix seconds
}

function getStateKey(): Buffer {
  const secret =
    process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "bizilcore-social-fallback-key";
  return crypto.createHash("sha256").update("oauth-state:" + secret).digest();
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

export function createNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function signState(payload: Omit<OAuthState, "exp" | "nonce"> & { nonce?: string }): {
  state: string;
  nonce: string;
} {
  const nonce = payload.nonce ?? createNonce();
  const full: OAuthState = {
    shopId: payload.shopId,
    platform: payload.platform,
    nonce,
    exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 min
  };
  const body = b64url(Buffer.from(JSON.stringify(full), "utf8"));
  const sig = b64url(crypto.createHmac("sha256", getStateKey()).update(body).digest());
  return { state: `${body}.${sig}`, nonce };
}

export function verifyState(state: string): OAuthState | null {
  try {
    const [body, sig] = state.split(".");
    if (!body || !sig) return null;
    const expected = b64url(crypto.createHmac("sha256", getStateKey()).update(body).digest());
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as OAuthState;
    if (!payload.shopId || !payload.nonce) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
