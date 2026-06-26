import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const due = await prisma.productSubscription.findMany({
    where: { status: "active", nextDeliveryAt: { lte: now } },
    take: 50,
  });

  let processed = 0;
  for (const sub of due) {
    const days = sub.frequency === "weekly" ? 7 : sub.frequency === "biweekly" ? 14 : 30;
    await prisma.productSubscription.update({
      where: { id: sub.id },
      data: { nextDeliveryAt: new Date(Date.now() + days * 86400000) },
    });
    processed++;
  }

  return NextResponse.json({ processed, due: due.length });
}
