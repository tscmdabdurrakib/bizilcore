import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ThreadMessage {
  id: string;
  message: string;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
}
interface Thread {
  key: string;
  channel: string;
  senderId: string;
  senderName: string | null;
  lastMessage: string;
  lastAt: string;
  unreplied: boolean;
  messages: ThreadMessage[];
}

/** Unified inbox — all channels (messenger/instagram/whatsapp) grouped into threads. */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const url = new URL(req.url);
  const channel = url.searchParams.get("channel");

  const rows = await prisma.messengerConversation.findMany({
    where: { shopId: shop.id, ...(channel ? { channel } : {}) },
    orderBy: { createdAt: "asc" },
    take: 1000,
  });

  const threadMap = new Map<string, Thread>();
  for (const r of rows) {
    const key = `${r.channel}:${r.senderId}`;
    let t = threadMap.get(key);
    if (!t) {
      t = {
        key,
        channel: r.channel,
        senderId: r.senderId,
        senderName: r.senderName,
        lastMessage: "",
        lastAt: r.createdAt.toISOString(),
        unreplied: false,
        messages: [],
      };
      threadMap.set(key, t);
    }
    if (r.senderName && !t.senderName) t.senderName = r.senderName;
    t.messages.push({
      id: r.id,
      message: r.message,
      reply: r.reply,
      repliedAt: r.repliedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    });
    t.lastMessage = r.reply ?? r.message;
    t.lastAt = r.createdAt.toISOString();
    // Inbound message with no reply anywhere later → needs attention.
    t.unreplied = r.message.trim().length > 0 && !r.reply;
  }

  const threads = [...threadMap.values()].sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));

  const counts = {
    all: threads.length,
    messenger: threads.filter((t) => t.channel === "messenger").length,
    instagram: threads.filter((t) => t.channel === "instagram").length,
    whatsapp: threads.filter((t) => t.channel === "whatsapp").length,
    unreplied: threads.filter((t) => t.unreplied).length,
  };

  return NextResponse.json({ threads, counts });
}
