import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function buildPublicUrl(req: NextRequest, path: string): string {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  if (host) return `${proto}://${host}${path}`;
  return new URL(path, req.url).toString();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("ref");

  if (!slug) {
    return NextResponse.redirect(buildPublicUrl(req, "/signup"));
  }

  const affiliate = await prisma.affiliate.findUnique({
    where: { slug },
    include: {
      user: {
        include: { referralCode: true },
      },
    },
  });

  if (!affiliate || affiliate.status !== "approved") {
    return NextResponse.redirect(buildPublicUrl(req, "/signup"));
  }

  // Record the click
  await prisma.affiliateClick.create({
    data: {
      affiliateId: affiliate.id,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0] ?? null,
      userAgent: req.headers.get("user-agent") ?? null,
    },
  });

  await prisma.affiliate.update({
    where: { id: affiliate.id },
    data: { totalClicks: { increment: 1 } },
  });

  // Build signup URL — include aff slug (affiliate tracking) + ref code (referral bonus for new user)
  const params = new URLSearchParams({ aff: slug });
  if (affiliate.user.referralCode?.code) {
    params.set("ref", affiliate.user.referralCode.code);
  }

  return NextResponse.redirect(buildPublicUrl(req, `/signup?${params.toString()}`));
}
