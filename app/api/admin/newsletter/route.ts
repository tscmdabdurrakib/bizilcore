import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "active";

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: status === "all" ? {} : { status },
    orderBy: { subscribedAt: "desc" },
  });

  const total = await prisma.newsletterSubscriber.count();
  const active = await prisma.newsletterSubscriber.count({ where: { status: "active" } });

  return NextResponse.json({ subscribers, total, active });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, status } = await req.json();
  await prisma.newsletterSubscriber.update({ where: { id }, data: { status } });
  return NextResponse.json({ ok: true });
}
