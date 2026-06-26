import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin/auth";

export async function POST() {
  const session = await auth();
  const realAdminId = (session?.user as { realAdminId?: string })?.realAdminId;
  if (!realAdminId) return NextResponse.json({ error: "Not impersonating" }, { status: 400 });

  await logAdminAction(realAdminId, "impersonate.end", "user", session?.user?.id);

  return NextResponse.json({ endImpersonation: true });
}
