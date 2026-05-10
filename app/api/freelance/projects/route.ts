import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { shop } = await requireShop();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = { shopId: shop.id };
    if (status && status !== "all") where.status = status;
    if (type && type !== "all") where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { client: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const projects = await prisma.freelanceProject.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        milestones: { select: { id: true, status: true, amount: true } },
        timeLogs: { select: { id: true, hours: true, billable: true } },
        _count: { select: { invoices: true } },
      },
    });

    return NextResponse.json(projects);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { shop } = await requireShop();
    const body = await req.json();

    const {
      title, type, clientId, clientName, clientPhone, clientCompany,
      platform, description, startDate, deadline,
      currency = "BDT", totalAmount, exchangeRate = 1, advancePaid = 0, notes,
    } = body;

    let resolvedClientId = clientId;
    if (!clientId && clientName) {
      const existing = await prisma.customer.findFirst({
        where: { shopId: shop.id, phone: clientPhone || undefined },
      });
      if (existing) {
        resolvedClientId = existing.id;
      } else {
        const newClient = await prisma.customer.create({
          data: {
            shopId: shop.id,
            name: clientName,
            phone: clientPhone || null,
            address: clientCompany || null,
          },
        });
        resolvedClientId = newClient.id;
      }
    }

    const year = new Date().getFullYear();
    const prefix = shop.freelanceProjectPrefix || "PRJ";
    const count = await prisma.freelanceProject.count({ where: { shopId: shop.id } });
    const projectNumber = `${prefix}-${year}-${String(count + 1).padStart(3, "0")}`;

    const totalAmountBDT = currency === "BDT" ? totalAmount : totalAmount * exchangeRate;
    const dueAmount = totalAmountBDT - advancePaid;

    const project = await prisma.freelanceProject.create({
      data: {
        shopId: shop.id,
        projectNumber,
        clientId: resolvedClientId,
        title,
        type,
        description: description || null,
        platform: platform || null,
        startDate: startDate ? new Date(startDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        totalAmount,
        currency,
        exchangeRate,
        totalAmountBDT,
        advancePaid,
        dueAmount,
        notes: notes || null,
        status: "in_progress",
      },
      include: {
        client: { select: { id: true, name: true, phone: true } },
      },
    });

    return NextResponse.json(project);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
