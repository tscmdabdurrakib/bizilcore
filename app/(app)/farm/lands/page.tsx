import { Suspense } from "react";
import LandsBoard from "./LandsBoard";
import { Loader2 } from "lucide-react";

export default function LandsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#16A34A" }} /></div>}>
      <LandsBoard />
    </Suspense>
  );
}
