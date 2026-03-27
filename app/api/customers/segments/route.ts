import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeSegments } from "@/lib/segments";

export const dynamic = "force-dynamic";

export type { SegmentKey, SegmentMember, SegmentCard } from "@/lib/segments";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const segments = await computeSegments(shop.id);

  return NextResponse.json({ segments });
}
