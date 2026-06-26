import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccountingShop } from "@/lib/accounting/auth";
import { createJournalEntry } from "@/lib/accounting/journal";

export async function GET(req: NextRequest) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop } = ctx;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const referenceType = searchParams.get("referenceType");
  const search = searchParams.get("search");
  const from = searchParams.get("start_date") ?? searchParams.get("from");
  const to = searchParams.get("end_date") ?? searchParams.get("to");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "30", 10);

  const where = {
    shopId: shop.id,
    ...(status ? { status } : {}),
    ...(referenceType ? { referenceType } : {}),
    ...(search ? { description: { contains: search, mode: "insensitive" as const } } : {}),
    ...(from || to
      ? {
          entryDate: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.journalEntry.findMany({
      where,
      include: { lines: true },
      orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.journalEntry.count({ where }),
  ]);

  const rows = entries.map((e) => {
    const debitTotal = e.lines.reduce((s, l) => s + l.debitAmount, 0);
    const creditTotal = e.lines.reduce((s, l) => s + l.creditAmount, 0);
    return {
      id: e.id,
      entryNumber: e.entryNumber,
      entryDate: e.entryDate,
      description: e.description,
      referenceType: e.referenceType,
      referenceId: e.referenceId,
      status: e.status,
      postedAt: e.postedAt,
      debitTotal,
      creditTotal,
    };
  });

  return NextResponse.json({ entries: rows, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop, session } = ctx;
  const body = await req.json();
  const { entryDate, description, lines, referenceType, referenceId, post } = body;

  if (!entryDate || !description || !Array.isArray(lines) || !lines.length) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const entry = await prisma.$transaction((tx) =>
      createJournalEntry(tx, {
        shopId: shop.id,
        userId: session.user.id,
        entryDate: new Date(entryDate),
        description,
        lines,
        referenceType,
        referenceId,
        post: !!post,
      }),
    );
    return NextResponse.json(entry, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create journal";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
