import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("Authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? "bizilcore-cron"}`;
  if (auth !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const baseUrl = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : `http://localhost:${process.env.PORT ?? 5000}`;

  const res = await fetch(`${baseUrl}/api/admin/backup`, {
    method: "POST",
    headers: { Authorization: expected },
  });
  const data = await res.json();
  return NextResponse.json(data);
}
