import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/auth";

export async function GET(req: NextRequest) {
  const authResult = await requireAdminRole("community");
  if ("error" in authResult) return authResult.error;

  const search = req.nextUrl.searchParams.get("search") ?? "";

  const posts = await prisma.communityPost.findMany({
    where: search
      ? { content: { contains: search, mode: "insensitive" } }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          accountStatus: true,
          subscription: { select: { plan: true } },
        },
      },
      _count: { select: { comments: true, likes: true } },
    },
  });

  return NextResponse.json(posts);
}
