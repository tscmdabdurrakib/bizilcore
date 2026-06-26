import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subscribeActivityStream } from "@/lib/activity/broadcast";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true, adminRole: true },
  });

  if (!user?.isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }
  const role = user.adminRole ?? "super";
  if (role !== "super") {
    return new Response("Forbidden", { status: 403 });
  }

  let unsubscribe: (() => void) | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      unsubscribe = subscribeActivityStream(ctrl);
      const keepAlive = setInterval(() => {
        try {
          ctrl.enqueue(new TextEncoder().encode(": ping\n\n"));
        } catch {
          clearInterval(keepAlive);
        }
      }, 25000);

      const cleanup = () => {
        clearInterval(keepAlive);
        unsubscribe?.();
      };

      (ctrl as unknown as { signal?: AbortSignal }).signal?.addEventListener("abort", cleanup);
    },
    cancel() {
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
