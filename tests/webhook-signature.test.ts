import { describe, it, expect, beforeAll } from "vitest";
import crypto from "crypto";

const APP_SECRET = "test-app-secret-123";

beforeAll(() => {
  process.env.META_APP_SECRET = APP_SECRET;
});

describe("verifyMetaWebhookSignature (security)", () => {
  it("accepts a correctly signed body", async () => {
    const { verifyMetaWebhookSignature } = await import("@/lib/social/meta");
    const body = JSON.stringify({ object: "page", entry: [] });
    const sig = "sha256=" + crypto.createHmac("sha256", APP_SECRET).update(body, "utf8").digest("hex");
    expect(verifyMetaWebhookSignature(body, sig)).toBe(true);
  });

  it("rejects a tampered body", async () => {
    const { verifyMetaWebhookSignature } = await import("@/lib/social/meta");
    const body = JSON.stringify({ object: "page", entry: [] });
    const sig = "sha256=" + crypto.createHmac("sha256", APP_SECRET).update(body, "utf8").digest("hex");
    expect(verifyMetaWebhookSignature(body + "x", sig)).toBe(false);
  });

  it("rejects a missing signature header", async () => {
    const { verifyMetaWebhookSignature } = await import("@/lib/social/meta");
    expect(verifyMetaWebhookSignature("{}", null)).toBe(false);
  });

  it("rejects a wrong-secret signature", async () => {
    const { verifyMetaWebhookSignature } = await import("@/lib/social/meta");
    const body = "{}";
    const sig = "sha256=" + crypto.createHmac("sha256", "wrong").update(body, "utf8").digest("hex");
    expect(verifyMetaWebhookSignature(body, sig)).toBe(false);
  });
});
