/**
 * Shared Meta (Facebook/Instagram/WhatsApp) Graph API helpers
 * for the Integrations module. Server-side only — never import
 * from client components (uses the app secret).
 */
import crypto from "crypto";

/** OAuth CSRF nonce cookie (set on /start, verified on /callback). */
export const NONCE_COOKIE = "social_oauth_nonce";
/** Encrypted pending user-token cookie for the FB page-picker step. */
export const PENDING_FB_COOKIE = "social_fb_pending";

export const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0";
export const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
export const FB_DIALOG_BASE = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`;

export class MetaApiError extends Error {
  code?: number;
  subcode?: number;
  constructor(message: string, code?: number, subcode?: number) {
    super(message);
    this.name = "MetaApiError";
    this.code = code;
    this.subcode = subcode;
  }
}

export function getMetaAppId(): string {
  return (
    process.env.META_APP_ID ||
    process.env.FACEBOOK_APP_ID ||
    process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ||
    ""
  );
}

export function getMetaAppSecret(): string {
  return process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET || "";
}

/** Base URL of this deployment (for OAuth redirect URIs). */
export function getBaseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:5000"
  );
}

export function isMetaConfigured(): boolean {
  return Boolean(getMetaAppId() && getMetaAppSecret());
}

/** appsecret_proof required by Meta for server-side Graph calls. */
export function appSecretProof(accessToken: string): string {
  return crypto.createHmac("sha256", getMetaAppSecret()).update(accessToken).digest("hex");
}

/**
 * Verify Meta's `X-Hub-Signature-256` header against the raw request body.
 * Protects webhooks from spoofed events (e.g. fake comment-orders).
 * Returns true only when the HMAC matches; returns false when no app secret
 * is configured (fail closed).
 */
export function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const secret = getMetaAppSecret();
  if (!secret || !signatureHeader) return false;
  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** GET on the Graph API with token + appsecret_proof. Throws MetaApiError. */
export async function graphGet<T = Record<string, unknown>>(
  path: string,
  accessToken: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = new URL(`${GRAPH_BASE}/${path.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("appsecret_proof", appSecretProof(accessToken));

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) {
    const err = data?.error ?? {};
    throw new MetaApiError(
      err.message || `Graph API error (${res.status})`,
      err.code,
      err.error_subcode,
    );
  }
  return data as T;
}

interface TokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number; // seconds
}

/** Exchange an OAuth `code` for a (short-lived) access token. */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
): Promise<TokenResponse> {
  const url = new URL(`${GRAPH_BASE}/oauth/access_token`);
  url.searchParams.set("client_id", getMetaAppId());
  url.searchParams.set("client_secret", getMetaAppSecret());
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code", code);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!data?.access_token) {
    const err = data?.error ?? {};
    throw new MetaApiError(err.message || "Token exchange failed", err.code, err.error_subcode);
  }
  return data as TokenResponse;
}

/** Exchange a short-lived user token for a long-lived one (~60 days). */
export async function exchangeForLongLivedToken(shortToken: string): Promise<TokenResponse> {
  const url = new URL(`${GRAPH_BASE}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", getMetaAppId());
  url.searchParams.set("client_secret", getMetaAppSecret());
  url.searchParams.set("fb_exchange_token", shortToken);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!data?.access_token) {
    const err = data?.error ?? {};
    throw new MetaApiError(
      err.message || "Long-lived token exchange failed",
      err.code,
      err.error_subcode,
    );
  }
  return data as TokenResponse;
}

export interface DebugTokenInfo {
  scopes: string[];
  expires_at?: number; // unix seconds, 0 = never
  granular_scopes: Array<{ scope: string; target_ids?: string[] }>;
}

/** Inspect a token using the app token (id|secret). */
export async function debugToken(inputToken: string): Promise<DebugTokenInfo> {
  const appToken = `${getMetaAppId()}|${getMetaAppSecret()}`;
  const url = new URL(`${GRAPH_BASE}/debug_token`);
  url.searchParams.set("input_token", inputToken);
  url.searchParams.set("access_token", appToken);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  const data = json?.data;
  if (!data) {
    const err = json?.error ?? {};
    throw new MetaApiError(err.message || "debug_token failed", err.code, err.error_subcode);
  }
  return {
    scopes: data.scopes ?? [],
    expires_at: data.expires_at,
    granular_scopes: data.granular_scopes ?? [],
  };
}

/** Best-effort revoke of all app permissions for the token's user. */
export async function revokePermissions(accessToken: string): Promise<void> {
  try {
    const url = new URL(`${GRAPH_BASE}/me/permissions`);
    url.searchParams.set("access_token", accessToken);
    url.searchParams.set("appsecret_proof", appSecretProof(accessToken));
    await fetch(url.toString(), { method: "DELETE", cache: "no-store" });
  } catch {
    // best effort — connection is removed locally regardless
  }
}

/** Convert an expires_in (seconds) to a Date, or null for non-expiring tokens. */
export function expiresInToDate(expiresIn?: number): Date | null {
  if (!expiresIn || expiresIn <= 0) return null;
  return new Date(Date.now() + expiresIn * 1000);
}
