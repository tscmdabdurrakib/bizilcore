import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["scheduled", "confirmed", "in_progress", "completed", "cancelled"];

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  scheduled:   ["confirmed", "cancelled"],
  confirmed:   ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed:   [],
  cancelled:   [],
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  if (shop.businessType !== "salon") {
    return NextResponse.json({ error: "এই API শুধুমাত্র সেলুন শপের জন্য।" }, { status: 403 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      items: { include: { service: { select: { id: true, name: true, commissionRate: true } } } },
      customer: { select: { id: true, name: true, phone: true } },
      staff: { select: { id: true, user: { select: { name: true } } } },
    },
  });

  if (!appointment || appointment.shopId !== shop.id) {
    return NextResponse.json({ error: "অ্যাপয়েন্টমেন্ট পাওয়া যায়নি।" }, { status: 404 });
  }

  return NextResponse.json(appointment);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  if (shop.businessType !== "salon") {
    return NextResponse.json({ error: "এই API শুধুমাত্র সেলুন শপের জন্য।" }, { status: 403 });
  }

  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: { items: { include: { service: { select: { commissionRate: true } } } } },
  });

  if (!appt || appt.shopId !== shop.id) {
    return NextResponse.json({ error: "অ্যাপয়েন্টমেন্ট পাওয়া যায়নি।" }, { status: 404 });
  }

  const body = await req.json();
  const { status, staffId, note, endTime, markCommissionPaid } = body;

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "অবৈধ স্ট্যাটাস।" }, { status: 400 });
    }
    if (status !== appt.status) {
      const allowed = ALLOWED_TRANSITIONS[appt.status] ?? [];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          { error: `'${appt.status}' থেকে '${status}' তে যাওয়া সম্ভব নয়।` },
          { status: 400 }
        );
      }
    }
  }

  if (staffId !== undefined && staffId !== null) {
    const staff = await prisma.staffMember.findUnique({ where: { id: staffId }, select: { id: true, shopId: true } });
    if (!staff || staff.shopId !== shop.id) {
      return NextResponse.json({ error: "স্টাফ পাওয়া যায়নি।" }, { status: 400 });
    }
  }

  const isCompleting = status === "completed" && appt.status !== "completed";

  await prisma.$transaction(async (tx) => {
    if (isCompleting) {
      for (const item of appt.items) {
        const rate = item.service?.commissionRate ?? 0.30;
        const commission = item.price * rate;
        await tx.appointmentItem.update({
          where: { id: item.id },
          data: { staffCommission: commission },
        });
      }
      await tx.appointment.update({
        where: { id },
        data: {
          status,
          ...(endTime ? { endTime } : { endTime: new Date().toTimeString().slice(0, 5) }),
          ...(staffId !== undefined ? { staffId } : {}),
          ...(note !== undefined ? { note } : {}),
        },
      });
    } else if (markCommissionPaid) {
      await tx.appointmentItem.updateMany({
        where: { appointmentId: id },
        data: { commissionPaid: true },
      });
      await tx.appointment.update({
        where: { id },
        data: { commissionPaid: true },
      });
    } else {
      await tx.appointment.update({
        where: { id },
        data: {
          ...(status !== undefined ? { status } : {}),
          ...(staffId !== undefined ? { staffId } : {}),
          ...(note !== undefined ? { note } : {}),
          ...(endTime !== undefined ? { endTime } : {}),
        },
      });
    }
  });

  const updated = await prisma.appointment.findUnique({
    where: { id },
    include: {
      items: { include: { service: { select: { id: true, name: true, commissionRate: true } } } },
      customer: { select: { id: true, name: true, phone: true } },
      staff: { select: { id: true, user: { select: { name: true } } } },
    },
  });

  return NextResponse.json(updated);
}
