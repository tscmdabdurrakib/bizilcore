"use client";

import { useEffect, useState } from "react";

interface Props {
  enabled?: boolean;
}

export function PwaInstallBanner({ enabled }: Props) {
  const [deferred, setDeferred] = useState<{ prompt: () => Promise<void> } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred({ prompt: () => (e as BeforeInstallPromptEvent).prompt() });
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, [enabled]);

  if (!enabled || !deferred || dismissed) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-3 bg-gray-900 text-white flex items-center gap-3">
      <p className="text-xs flex-1">অ্যাপ হিসেবে যোগ করুন — দ্রুত অর্ডার!</p>
      <button
        onClick={async () => { await deferred.prompt(); setDismissed(true); }}
        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-600"
      >
        Install
      </button>
      <button onClick={() => setDismissed(true)} className="text-xs opacity-60">✕</button>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}
