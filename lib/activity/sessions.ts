import { prisma } from "@/lib/prisma";

export async function createUserSession({
  userId,
  shopId,
  deviceType,
  browser,
  ipAddress,
}: {
  userId: string;
  shopId?: string | null;
  deviceType?: string | null;
  browser?: string | null;
  ipAddress?: string | null;
}) {
  return prisma.userSession.create({
    data: {
      userId,
      shopId: shopId ?? null,
      deviceType: deviceType ?? null,
      browser: browser ?? null,
      ipAddress: ipAddress ?? null,
    },
  });
}

export async function closeUserSession(userId: string) {
  const openSession = await prisma.userSession.findFirst({
    where: { userId, sessionEnd: null },
    orderBy: { sessionStart: "desc" },
  });
  if (!openSession) return;

  const sessionEnd = new Date();
  const durationMinutes = Math.max(
    1,
    Math.round((sessionEnd.getTime() - openSession.sessionStart.getTime()) / 60000),
  );

  await prisma.userSession.update({
    where: { id: openSession.id },
    data: { sessionEnd, durationMinutes },
  });
}

export async function bumpSessionStats(
  userId: string,
  kind: "page_view" | "action",
) {
  const openSession = await prisma.userSession.findFirst({
    where: { userId, sessionEnd: null },
    orderBy: { sessionStart: "desc" },
  });
  if (!openSession) return;

  await prisma.userSession.update({
    where: { id: openSession.id },
    data:
      kind === "page_view"
        ? { pagesVisited: { increment: 1 } }
        : { actionsTaken: { increment: 1 } },
  });
}
