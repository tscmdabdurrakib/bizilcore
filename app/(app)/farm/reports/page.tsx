import { Suspense } from "react";
import FarmReports from "./FarmReports";
import { Loader2 } from "lucide-react";

export default function FarmReportsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#16A34A" }} /></div>}>
      <FarmReports />
    </Suspense>
  );
}
