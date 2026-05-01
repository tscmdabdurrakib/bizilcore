import { Suspense } from "react";
import BuyersBoard from "./BuyersBoard";
import { Loader2 } from "lucide-react";

export default function BuyersPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#16A34A" }} /></div>}>
      <BuyersBoard />
    </Suspense>
  );
}
