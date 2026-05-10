import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const months = parseInt(searchParams.get("months") || "3");

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setHours(0, 0, 0, 0);

  const [allJobs, allDevices] = await Promise.all([
    prisma.jobCard.findMany({
      where: { shopId: shop.id, deviceId: { not: null }, createdAt: { gte: startDate } },
      include: {
        device: { select: { type: true, brand: true, model: true } },
        parts: { select: { subtotal: true } },
        services: { select: { laborCost: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.device.findMany({
      where: { shopId: shop.id },
      select: { type: true, brand: true },
    }),
  ]);

  // Monthly revenue
  const monthlyMap = new Map<string, { revenue: number; partsTotal: number; count: number }>();
  for (const job of allJobs) {
    const key = job.createdAt.toISOString().slice(0, 7);
    const existing = monthlyMap.get(key) || { revenue: 0, partsTotal: 0, count: 0 };
    const partsTotal = job.parts.reduce((s, p) => s + p.subtotal, 0);
    monthlyMap.set(key, {
      revenue: existing.revenue + job.totalAmount,
      partsTotal: existing.partsTotal + partsTotal,
      count: existing.count + 1,
    });
  }
  const monthlyRevenue = Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month,
    revenue: Math.round(data.revenue),
    partsTotal: Math.round(data.partsTotal),
    profit: Math.round(data.revenue - data.partsTotal),
    count: data.count,
  })).sort((a, b) => a.month.localeCompare(b.month));

  // Device type breakdown
  const typeMap = new Map<string, number>();
  for (const job of allJobs) {
    const type = job.device?.type || "other";
    typeMap.set(type, (typeMap.get(type) || 0) + 1);
  }
  const deviceTypeBreakdown = Array.from(typeMap.entries()).map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Most common complaints (from complaint text, top keywords)
  const complaintMap = new Map<string, number>();
  for (const job of allJobs) {
    const complaint = job.complaint.slice(0, 50);
    complaintMap.set(complaint, (complaintMap.get(complaint) || 0) + 1);
  }
  const topComplaints = Array.from(complaintMap.entries())
    .map(([complaint, count]) => ({ complaint, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Warranty claim rate (jobs with warrantyDays > 0)
  const jobsWithWarranty = allJobs.filter(j => j.warrantyDays && j.warrantyDays > 0).length;
  const warrantyRate = allJobs.length > 0 ? Math.round((jobsWithWarranty / allJobs.length) * 100) : 0;

  // Avg revenue per job
  const totalRevenue = allJobs.reduce((s, j) => s + j.totalAmount, 0);
  const avgRevenue = allJobs.length > 0 ? Math.round(totalRevenue / allJobs.length) : 0;

  // Status breakdown
  const statusMap = new Map<string, number>();
  for (const job of allJobs) {
    statusMap.set(job.status, (statusMap.get(job.status) || 0) + 1);
  }
  const statusBreakdown = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

  // Top brands repaired
  const brandMap = new Map<string, number>();
  for (const job of allJobs) {
    const brand = job.device?.brand || "Other";
    brandMap.set(brand, (brandMap.get(brand) || 0) + 1);
  }
  const topBrands = Array.from(brandMap.entries())
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return NextResponse.json({
    monthlyRevenue,
    deviceTypeBreakdown,
    topComplaints,
    warrantyRate,
    avgRevenue,
    totalJobs: allJobs.length,
    totalRevenue: Math.round(totalRevenue),
    statusBreakdown,
    topBrands,
  });
}
