"use client";

import { ArrowLeftRight } from "lucide-react";

interface Props {
  onClick: () => void;
  visible: boolean;
}

export default function TransferFab({ onClick, visible }: Props) {
  if (!visible) return null;
  return (
    <button onClick={onClick}
      className="md:hidden fixed bottom-20 right-5 z-40 w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center text-white"
      style={{ background: "linear-gradient(135deg,#3B82F6,#2563EB)" }}
      aria-label="Stock Transfer"
    >
      <ArrowLeftRight size={22} />
    </button>
  );
}
