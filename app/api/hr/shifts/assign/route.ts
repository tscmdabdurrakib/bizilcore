import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { shiftId, staffId, weekStart } = body;

  if (!shiftId || !staffId || !weekStart) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  const assignment = await prisma.shiftAssignment.upsert({
    where: {
      shiftId_staffId_weekStart: {
        shiftId,
        staffId,
        weekStart: new Date(weekStart),
      },
    },
    create: { shiftId, staffId, weekStart: new Date(weekStart) },
    update: {},
  });

  return NextResponse.json(assignment, { status: 201 });
}
