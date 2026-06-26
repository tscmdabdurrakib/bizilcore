import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveShopForApi } from "@/lib/shops/access";

const DEFAULT_REPLIES = [
  { title: "Price?", body: "দাম জানতে পণ্যের লিংক দেখুন অথবা পণ্যের নাম লিখুন।" },
  { title: "Delivery time?", body: "ঢাকার ভিতরে ১-২ দিন, বাইরে ৩-৫ দিন।" },
  { title: "Stock?", body: "স্টক আছে! নাম, ঠিকানা, ফোন দিয়ে অর্ডার কনফার্ম করুন।" },
];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  let replies = await prisma.messengerCannedReply.findMany({
    where: { shopId: shopCtx.activeShop.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  if (!replies.length) {
    replies = await Promise.all(
      DEFAULT_REPLIES.map((r, i) =>
        prisma.messengerCannedReply.create({
          data: { shopId: shopCtx.activeShop.id, title: r.title, body: r.body, sortOrder: i },
        }),
      ),
    );
  }

  return NextResponse.json(replies);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  const { title, body } = await req.json();
  if (!title || !body) return NextResponse.json({ error: "title and body required" }, { status: 400 });

  const reply = await prisma.messengerCannedReply.create({
    data: { shopId: shopCtx.activeShop.id, title, body },
  });
  return NextResponse.json(reply, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  const { id } = await req.json();
  await prisma.messengerCannedReply.deleteMany({ where: { id, shopId: shopCtx.activeShop.id } });
  return NextResponse.json({ ok: true });
}
