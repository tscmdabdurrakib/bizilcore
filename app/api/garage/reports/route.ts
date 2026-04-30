import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const dateFilter = from && to ? {
    createdAt: { gte: new Date(from), lte: new Date(to + "T23:59:59") },
  } : {};

  const [allJobs, staffMembers] = await Promise.all([
    prisma.jobCard.findMany({
      where: { shopId: shop.id, ...dateFilter },
      include: {
        services: true,
        parts: true,
        vehicle: { select: { type: true, brand: true } },
      },
    }),
    prisma.staffMember.findMany({
      where: { shopId: shop.id, isActive: true },
      include: { user: { select: { name: true } } },
    }),
  ]);

  const totalRevenue = allJobs.reduce((sum, j) => sum + j.totalAmount, 0);
  const totalPartsRevenue = allJobs.reduce((sum, j) => sum + j.partsTotal, 0);
  const totalLaborRevenue = allJobs.reduce((sum, j) => sum + j.laborCharge, 0);
  const totalPending = allJobs.reduce((sum, j) => sum + j.dueAmount, 0);

  const mechanicMap: Record<string, { name: string; jobs: number; revenue: number }> = {};
  for (const job of allJobs) {
    const mechId = job.assignedToId;
    if (mechId) {
      if (!mechanicMap[mechId]) {
        const staff = staffMembers.find(s => s.id === mechId);
        mechanicMap[mechId] = { name: staff?.user?.name || "Unknown", jobs: 0, revenue: 0 };
      }
      mechanicMap[mechId].jobs++;
      mechanicMap[mechId].revenue += job.laborCharge;
    }
  }

  const repairCounts: Record<string, number> = {};
  for (const job of allJobs) {
    for (const svc of job.services) {
      repairCounts[svc.serviceName] = (repairCounts[svc.serviceName] || 0) + 1;
    }
  }
  const topRepairs = Object.entries(repairCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const monthlyMap: Record<string, { revenue: number; parts: number; labor: number }> = {};
  for (const job of allJobs) {
    const month = job.createdAt.toISOString().slice(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = { revenue: 0, parts: 0, labor: 0 };
    monthlyMap[month].revenue += job.totalAmount;
    monthlyMap[month].parts += job.partsTotal;
    monthlyMap[month].labor += job.laborCharge;
  }
  const monthly = Object.entries(monthlyMap).sort().map(([month, d]) => ({ month, ...d }));

  const pendingJobs = allJobs.filter(j => j.dueAmount > 0 && j.status !== "delivered").map(j => ({
    id: j.id,
    jobNumber: j.jobNumber,
    totalAmount: j.totalAmount,
    dueAmount: j.dueAmount,
    status: j.status,
  }));

  const completedJobs = allJobs.filter(j => j.status === "delivered");
  const avgCompletionMs = completedJobs.length > 0
    ? completedJobs.reduce((sum, j) => {
        const created = new Date(j.createdAt).getTime();
        const delivered = j.deliveredAt ? new Date(j.deliveredAt).getTime() : Date.now();
        return sum + (delivered - created);
      }, 0) / completedJobs.length
    : 0;
  const avgCompletionDays = Math.round(avgCompletionMs / (1000 * 60 * 60 * 24) * 10) / 10;

  return NextResponse.json({
    summary: { totalRevenue, totalPartsRevenue, totalLaborRevenue, totalPending, totalJobs: allJobs.length },
    mechanicPerformance: Object.values(mechanicMap),
    topRepairs,
    monthly,
    pendingJobs,
    avgCompletionDays,
  });
}
