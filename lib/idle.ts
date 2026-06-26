/**
 * Run a callback when the browser is idle (falls back to a short timeout when
 * `requestIdleCallback` is unavailable, e.g. Safari). Returns a cleanup
 * function that cancels the scheduled callback if it hasn't run yet.
 *
 * Use this to defer non-critical client fetches so they don't compete with
 * first paint / interactivity on page load.
 */
export function onIdle(cb: () => void, timeout = 1200): () => void {
  if (typeof window === "undefined") return () => {};
  const w = window as unknown as {
    requestIdleCallback?: (cb: () => void) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (typeof w.requestIdleCallback === "function") {
    const id = w.requestIdleCallback(cb);
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(cb, timeout);
  return () => clearTimeout(id);
}
