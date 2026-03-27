import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isAdmin: true } });
  if (!user?.isAdmin) return null;
  return session;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;

  try {
    const body = await req.json();
    const {
      description, discountType, discountValue,
      maxUses, maxUsesPerUser, validFrom, validTo,
      minAmount, applicablePlans, baseMonths, isActive,
    } = body;

    const existing = await prisma.promoCode.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Promo code পাওয়া যায়নি" }, { status: 404 });

    const updateData: Record<string, unknown> = {};

    if (description !== undefined) updateData.description = description?.trim() || null;
    if (discountType !== undefined) {
      if (!["PERCENT", "FIXED"].includes(discountType)) {
        return NextResponse.json({ error: "Invalid discount type" }, { status: 400 });
      }
      updateData.discountType = discountType;
    }
    if (discountValue !== undefined) {
      const val = parseFloat(discountValue);
      if (isNaN(val) || val <= 0) return NextResponse.json({ error: "Valid discount value দিন" }, { status: 400 });
      if ((discountType ?? existing.discountType) === "PERCENT" && val > 100) {
        return NextResponse.json({ error: "Percentage ১০০ এর বেশি হতে পারে না" }, { status: 400 });
      }
      updateData.discountValue = val;
    }
    if (maxUses !== undefined) updateData.maxUses = maxUses ? parseInt(maxUses) : null;
    if (maxUsesPerUser !== undefined) updateData.maxUsesPerUser = maxUsesPerUser ? parseInt(maxUsesPerUser) : 1;
    if (validFrom !== undefined) updateData.validFrom = validFrom ? new Date(validFrom) : null;
    if (validTo !== undefined) updateData.validTo = validTo ? new Date(validTo) : null;
    if (minAmount !== undefined) updateData.minAmount = minAmount ? parseFloat(minAmount) : null;
    if (applicablePlans !== undefined) updateData.applicablePlans = applicablePlans?.trim() || null;
    if (baseMonths !== undefined) updateData.baseMonths = baseMonths ? parseInt(baseMonths) : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.promoCode.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true, promo: updated });
  } catch (err) {
    console.error("[AdminPromo PATCH] Error:", err);
    return NextResponse.json({ error: "সমস্যা হয়েছে" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;

  try {
    const existing = await prisma.promoCode.findUnique({ where: { id }, include: { _count: { select: { usages: true } } } });
    if (!existing) return NextResponse.json({ error: "Promo code পাওয়া যায়নি" }, { status: 404 });

    await prisma.promoCodeUsage.deleteMany({ where: { promoCodeId: id } });
    await prisma.payment.updateMany({ where: { promoCodeId: id }, data: { promoCodeId: null } });
    await prisma.promoCode.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[AdminPromo DELETE] Error:", err);
    return NextResponse.json({ error: "সমস্যা হয়েছে" }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;

  const promo = await prisma.promoCode.findUnique({
    where: { id },
    include: {
      usages: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { usedAt: "desc" },
        take: 50,
      },
      _count: { select: { usages: true, payments: true } },
    },
  });

  if (!promo) return NextResponse.json({ error: "পাওয়া যায়নি" }, { status: 404 });
  return NextResponse.json({ promo });
}
