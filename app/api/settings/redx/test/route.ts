import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { apiKey } = body as { apiKey?: string };

  if (!apiKey?.trim()) return NextResponse.json({ error: "API Key দিন" }, { status: 400 });

  try {
    const res = await fetch("https://openapi.redx.com.bd/v1.0.0.beta/parcel/list", {
      headers: { Authorization: `Bearer ${apiKey.trim()}` },
    });
    if (res.ok || res.status === 200) {
      return NextResponse.json({ success: true, message: "RedX সংযোগ সফল!" });
    }
    const data = await res.json();
    return NextResponse.json({ error: `RedX: ${data.message ?? "অবৈধ API Key"}` }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "RedX সার্ভারে পৌঁছানো যাচ্ছে না" }, { status: 502 });
  }
}
