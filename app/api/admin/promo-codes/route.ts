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

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const codes = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { usages: true, payments: true } },
    },
  });

  return NextResponse.json({ codes });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const body = await req.json();
    const {
      code, description, discountType, discountValue,
      maxUses, maxUsesPerUser, validFrom, validTo,
      minAmount, applicablePlans, baseMonths, isActive,
    } = body;

    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json({ error: "Code, discount type এবং value দিন" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,20}$/.test(cleanCode)) {
      return NextResponse.json({ error: "Code শুধু A-Z, 0-9, _ এবং - দিয়ে হবে (৩-২০ character)" }, { status: 400 });
    }

    const exists = await prisma.promoCode.findUnique({ where: { code: cleanCode } });
    if (exists) return NextResponse.json({ error: "এই code আগেই আছে" }, { status: 409 });

    if (!["PERCENT", "FIXED"].includes(discountType)) {
      return NextResponse.json({ error: "Discount type PERCENT বা FIXED হতে হবে" }, { status: 400 });
    }

    const val = parseFloat(discountValue);
    if (isNaN(val) || val <= 0) {
      return NextResponse.json({ error: "Valid discount value দিন" }, { status: 400 });
    }
    if (discountType === "PERCENT" && val > 100) {
      return NextResponse.json({ error: "Percentage ১০০ এর বেশি হতে পারে না" }, { status: 400 });
    }

    const promo = await prisma.promoCode.create({
      data: {
        code: cleanCode,
        description: description?.trim() || null,
        discountType,
        discountValue: val,
        maxUses: maxUses ? parseInt(maxUses) : null,
        maxUsesPerUser: maxUsesPerUser ? parseInt(maxUsesPerUser) : 1,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        minAmount: minAmount ? parseFloat(minAmount) : null,
        applicablePlans: applicablePlans?.trim() || null,
        baseMonths: baseMonths ? parseInt(baseMonths) : null,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ success: true, promo });
  } catch (err) {
    console.error("[AdminPromo POST] Error:", err);
    return NextResponse.json({ error: "সমস্যা হয়েছে" }, { status: 500 });
  }
}
