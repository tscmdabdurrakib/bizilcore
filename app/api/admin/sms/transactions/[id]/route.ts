import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/sms/auth";
import { completePurchase, rejectPurchase } from "@/lib/sms/credits";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const body = await req.json();
  const action = body.action as string;

  if (action === "confirm") {
    try {
      await completePurchase(id, body.paymentReference);
      return NextResponse.json({ success: true, message: "Payment confirmed. Credits added." });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Confirm failed" },
        { status: 400 }
      );
    }
  }

  if (action === "reject") {
    await rejectPurchase(id, body.note);
    return NextResponse.json({ success: true, message: "Payment rejected." });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
