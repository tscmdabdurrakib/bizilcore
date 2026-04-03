import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isAdmin: true } });
  return user?.isAdmin ? session.user.id : null;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const tips = await prisma.communityTip.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(tips);
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { title, body, category, week } = await req.json();
  if (!title?.trim() || !body?.trim()) return NextResponse.json({ error: "শিরোনাম ও বিস্তারিত লিখুন" }, { status: 400 });

  const tip = await prisma.communityTip.create({
    data: { title: title.trim(), body: body.trim(), category: category || null, week: week || null },
  });

  try {
    const allUserIds = await prisma.user.findMany({ where: { onboarded: true }, select: { id: true } });
    if (allUserIds.length > 0) {
      await prisma.notification.createMany({
        data: allUserIds.map(u => ({
          userId: u.id,
          type: "community_tip",
          title: "💡 নতুন Community টিপস",
          body: title.trim(),
          link: "/community-tips",
          read: false,
        })),
        skipDuplicates: true,
      });
    }
  } catch {
    // Non-critical — tip was already created
  }

  return NextResponse.json(tip, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, title, body, category, week, isActive } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  const tip = await prisma.communityTip.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(body !== undefined && { body: body.trim() }),
      ...(category !== undefined && { category: category || null }),
      ...(week !== undefined && { week: week || null }),
      ...(isActive !== undefined && { isActive }),
    },
  });
  return NextResponse.json(tip);
}

export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  // Delete reactions first to avoid foreign key constraint violation
  await prisma.tipReaction.deleteMany({ where: { tipId: id } });
  await prisma.communityTip.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
