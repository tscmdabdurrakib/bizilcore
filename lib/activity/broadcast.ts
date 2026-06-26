type Controller = ReadableStreamDefaultController<Uint8Array>;

const activeConnections = new Set<Controller>();

export function broadcastActivity(data: object) {
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

export function subscribeActivityStream(ctrl: Controller) {
  activeConnections.add(ctrl);
  return () => activeConnections.delete(ctrl);
}

export function activitySubscriberCount() {
  return activeConnections.size;
}
