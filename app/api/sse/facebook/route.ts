export const dynamic = "force-dynamic";

type Controller = ReadableStreamDefaultController<Uint8Array>;

const activeConnections = new Set<Controller>();

export function broadcast(data: object) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(msg);
  activeConnections.forEach((ctrl) => {
    try {
      ctrl.enqueue(encoded);
    } catch {
      activeConnections.delete(ctrl);
    }
  });
}

export async function GET() {
  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      activeConnections.add(ctrl);
      const keepAlive = setInterval(() => {
        try {
          ctrl.enqueue(new TextEncoder().encode(": ping\n\n"));
        } catch {
          clearInterval(keepAlive);
        }
      }, 25000);

      const cleanup = () => {
        clearInterval(keepAlive);
        activeConnections.delete(ctrl);
      };

      (ctrl as unknown as { signal?: AbortSignal }).signal?.addEventListener("abort", cleanup);
    },
    cancel(ctrl) {
      activeConnections.delete(ctrl);
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
