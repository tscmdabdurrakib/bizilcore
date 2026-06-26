import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BIZ_LABEL: Record<string, string> = {
  fcommerce: "ফেসবুক কমার্স",
  retail: "রিটেইল দোকান",
  restaurant: "রেস্টুরেন্ট",
  pharmacy: "ফার্মেসি",
  salon: "সেলুন",
  tailor: "টেইলর",
  hotel: "হোটেল",
};

function maskName(full: string | null | undefined): string {
  if (!full) return "Anon";
  const parts = full.trim().split(/\s+/);
  const first = parts[0] ?? "Anon";
  const lastInitial = parts.length > 1 ? `${parts[parts.length - 1][0]}.` : "";
  return `${first}${lastInitial ? " " + lastInitial : ""}`;
}

function truncate(s: string | null | undefined, n: number) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export async function GET() {
  const reviews = await prisma.appReview.findMany({
    where: { isApproved: true, showOnSite: true },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const items = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    text: truncate(r.body || r.title || "", 150),
    name: maskName(r.user?.name),
    businessLabel: r.businessType ? BIZ_LABEL[r.businessType] ?? null : null,
    createdAt: r.createdAt,
  }));

  return NextResponse.json(items, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60" },
  });
}
