import { Suspense } from "react";
import LivestockBoard from "./LivestockBoard";
import { Loader2 } from "lucide-react";

export default function LivestockPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#16A34A" }} /></div>}>
      <LivestockBoard />
    </Suspense>
  );
}
