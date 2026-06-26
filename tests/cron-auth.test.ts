import { describe, it, expect, afterEach } from "vitest";

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
});

function makeReq(authHeader?: string): Request {
  return new Request("https://example.com/api/cron/x", {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe("isAuthorizedCron (security)", () => {
  it("accepts the configured secret", async () => {
    process.env.CRON_SECRET = "s3cr3t";
    const { isAuthorizedCron } = await import("@/lib/cron-auth");
    expect(isAuthorizedCron(makeReq("Bearer s3cr3t"))).toBe(true);
  });

  it("rejects a wrong secret", async () => {
    process.env.CRON_SECRET = "s3cr3t";
    const { isAuthorizedCron } = await import("@/lib/cron-auth");
    expect(isAuthorizedCron(makeReq("Bearer nope"))).toBe(false);
  });

  it("rejects when no header is present", async () => {
    process.env.CRON_SECRET = "s3cr3t";
    const { isAuthorizedCron } = await import("@/lib/cron-auth");
    expect(isAuthorizedCron(makeReq())).toBe(false);
  });
});
