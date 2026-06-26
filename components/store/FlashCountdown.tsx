"use client";

import { useEffect, useState } from "react";

interface Props {
  endAt: string;
  primary?: string;
}

function formatRemaining(ms: number) {
  if (ms <= 0) return "শেষ";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function FlashCountdown({ endAt, primary = "#EF4444" }: Props) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const end = new Date(endAt).getTime();
    function tick() {
      setRemaining(formatRemaining(end - Date.now()));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endAt]);

  return (
    <span
      className="text-[10px] font-bold px-2 py-1 rounded-full text-white shadow-sm inline-block"
      style={{ backgroundColor: primary }}
    >
      ⚡ {remaining}
    </span>
  );
}
