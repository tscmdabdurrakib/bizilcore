import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  let dateFilter = {};
  if (dateStr) {
    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateStr);
    end.setHours(23, 59, 59, 999);
    dateFilter = { date: { gte: start, lte: end } };
  } else if (fromStr && toStr) {
    const start = new Date(fromStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(toStr);
    end.setHours(23, 59, 59, 999);
    dateFilter = { date: { gte: start, lte: end } };
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id, ...dateFilter },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const taxRate = parseFloat(body.taxRate || "0");
  const taxAmount = parseFloat(body.taxAmount || "0");
  const transaction = await prisma.transaction.create({
    data: {
      userId: session.user.id,
      type: body.type,
      amount: parseFloat(body.amount),
      category: body.category || null,
      note: body.note || null,
      date: body.date ? new Date(body.date) : new Date(),
      taxRate,
      taxAmount,
    },
  });
  return NextResponse.json(transaction, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const body = await req.json();
  const taxRate = parseFloat(body.taxRate || "0");
  const taxAmount = parseFloat(body.taxAmount || "0");
  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      type: body.type,
      amount: parseFloat(body.amount),
      category: body.category || null,
      note: body.note || null,
      date: body.date ? new Date(body.date) : undefined,
      taxRate,
      taxAmount,
    },
  });
  return NextResponse.json(transaction);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
