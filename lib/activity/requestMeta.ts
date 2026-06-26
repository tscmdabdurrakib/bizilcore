import { UAParser } from "ua-parser-js";

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip") || "unknown";
}

export function parseUserAgent(ua: string) {
  const parser = new UAParser(ua);
  const browser = parser.getBrowser().name || "Unknown";
  const deviceType = parser.getDevice().type || "desktop";
  return { browser, deviceType };
}
