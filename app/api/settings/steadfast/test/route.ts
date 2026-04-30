import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { apiKey, secretKey } = body as { apiKey?: string; secretKey?: string };

  if (!apiKey?.trim() || !secretKey?.trim()) {
    return NextResponse.json({ error: "API Key এবং Secret Key দিন" }, { status: 400 });
  }

  try {
    const res = await fetch("https://portal.steadfast.com.bd/api/v1/get_balance", {
      headers: {
        "Api-Key": apiKey.trim(),
        "Secret-Key": secretKey.trim(),
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    if (res.ok && data.status === 200) {
      return NextResponse.json({ success: true, message: `Steadfast সংযোগ সফল! Balance: ৳${data.current_balance ?? 0}` });
    }
    return NextResponse.json({ error: `Steadfast: ${data.message ?? "অবৈধ credentials"}` }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Steadfast সার্ভারে পৌঁছানো যাচ্ছে না" }, { status: 502 });
  }
}
