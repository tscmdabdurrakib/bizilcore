import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getPathaoToken(creds: { clientId: string; clientSecret: string; username: string; password: string; sandboxMode: boolean }) {
  const baseUrl = creds.sandboxMode ? "https://hermes-sandbox.pathao.com" : "https://hermes.pathao.com";
  const res = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      username: creds.username,
      password: creds.password,
      grant_type: "password",
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(data.message ?? "Auth failed");
  return { token: data.access_token as string, baseUrl };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cityId = searchParams.get("cityId");

  const settings = await prisma.pathaoSettings.findUnique({ where: { userId: session.user.id } });
  if (!settings?.isConnected || !settings.clientId || !settings.clientSecret || !settings.username || !settings.password) {
    return NextResponse.json({ error: "Pathao সংযুক্ত নেই" }, { status: 400 });
  }

  try {
    const { token, baseUrl } = await getPathaoToken({
      clientId: settings.clientId,
      clientSecret: settings.clientSecret,
      username: settings.username,
      password: settings.password,
      sandboxMode: settings.sandboxMode,
    });

    if (cityId) {
      const res = await fetch(`${baseUrl}/aladdin/api/v1/countries/cities/${cityId}/zones`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const data = await res.json();
      const zones = (data.data?.data ?? data.data ?? []) as { id: number; name: string }[];
      return NextResponse.json({ zones });
    } else {
      const res = await fetch(`${baseUrl}/aladdin/api/v1/countries/cities`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const data = await res.json();
      const cities = (data.data?.data ?? data.data ?? []) as { id: number; name: string }[];
      return NextResponse.json({ cities });
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "API error" }, { status: 502 });
  }
}
