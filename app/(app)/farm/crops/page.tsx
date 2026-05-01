import { Suspense } from "react";
import CropsBoard from "./CropsBoard";
import { Loader2 } from "lucide-react";

export default function CropsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#16A34A" }} /></div>}>
      <CropsBoard />
    </Suspense>
  );
}
