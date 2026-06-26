import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCron, getCronSecret } from "@/lib/cron-auth";

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const baseUrl = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : `http://localhost:${process.env.PORT ?? 5000}`;

  const res = await fetch(`${baseUrl}/api/admin/backup`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getCronSecret() ?? ""}` },
  });
  const data = await res.json();
  return NextResponse.json(data);
}
