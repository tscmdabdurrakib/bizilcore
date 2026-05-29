// Simple in-process manager approval token store
// Tokens are one-time-use and expire after 30 minutes

interface TokenEntry {
  shopId: string;
  expiresAt: number;
}

const tokens = new Map<string, TokenEntry>();

function purgeExpired() {
  const now = Date.now();
  for (const [k, v] of tokens.entries()) {
    if (v.expiresAt < now) tokens.delete(k);
  }
}

export function createManagerToken(shopId: string): string {
  purgeExpired();
  const token =
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36);
  tokens.set(token, { shopId, expiresAt: Date.now() + 30 * 60 * 1000 });
  return token;
}

export function verifyAndConsumeManagerToken(token: string, shopId: string): boolean {
  purgeExpired();
  const entry = tokens.get(token);
  if (!entry) return false;
  if (entry.shopId !== shopId) return false;
  if (entry.expiresAt < Date.now()) { tokens.delete(token); return false; }
  tokens.delete(token); // one-time use
  return true;
}
