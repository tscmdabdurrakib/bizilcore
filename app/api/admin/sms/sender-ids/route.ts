import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/sms/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const requests = await prisma.smsSenderIdRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ requests });
}
