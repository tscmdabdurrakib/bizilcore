"use client";

import { useEffect, useRef, useState } from "react";
import { X, Camera } from "lucide-react";

interface Props {
  onDetected: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const readerRef = useRef<unknown>(null);

  useEffect(() => {
    let stopped = false;

    async function start() {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const deviceId = devices.length > 0 ? devices[devices.length - 1].deviceId : undefined;

        setScanning(true);
        reader.decodeFromVideoDevice(
          deviceId ?? undefined,
          videoRef.current!,
          (result, err) => {
            if (stopped) return;
            if (result) {
              const code = result.getText();
              stopped = true;
              onDetected(code);
            }
            if (err && !(err instanceof Error && err.message.includes("No MultiFormat Readers"))) {
            }
          }
        );
      } catch (e) {
        setError("Camera access করা যাচ্ছে না। Permission দিন।");
        console.error(e);
      }
    }

    start();

    return () => {
      stopped = true;
      if (readerRef.current) {
        const r = readerRef.current as { reset?: () => void };
        r.reset?.();
      }
    };
  }, [onDetected]);

  const S = { surface: "#FFFFFF", border: "#E8E6DF", text: "#1A1A18", muted: "#A8A69E", primary: "#0F6E56" };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm" style={{ backgroundColor: S.surface }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera size={18} style={{ color: S.primary }} />
            <h3 className="font-semibold text-sm" style={{ color: S.text }}>Barcode Scan করুন</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} style={{ color: S.muted }} />
          </button>
        </div>

        {error ? (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: "#E24B4A" }}>{error}</p>
            <button onClick={onClose} className="mt-3 text-sm font-medium" style={{ color: S.primary }}>বন্ধ করুন</button>
          </div>
        ) : (
          <>
            <div className="relative rounded-xl overflow-hidden bg-black aspect-square mb-3">
              <video ref={videoRef} className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-white rounded-xl opacity-70" />
              </div>
            </div>
            <p className="text-xs text-center" style={{ color: S.muted }}>
              {scanning ? "Camera তৈরি হচ্ছে..." : "Barcode টি frame এর মধ্যে ধরুন"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
