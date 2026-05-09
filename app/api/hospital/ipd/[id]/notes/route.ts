import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  const notes = await prisma.iPDNote.findMany({
    where: { admissionId: id, shopId: shop.id },
    orderBy: { writtenAt: "desc" },
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;
  const body = await req.json();

  const note = await prisma.iPDNote.create({
    data: {
      shopId: shop.id,
      admissionId: id,
      noteType: body.noteType ?? "general",
      note: body.note,
      writtenById: body.writtenById ?? null,
    },
  });

  return NextResponse.json(note, { status: 201 });
}
