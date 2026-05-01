import { requireShop } from "@/lib/getShop";
import { Suspense } from "react";
import HospitalReports from "./HospitalReports";
import { Loader2 } from "lucide-react";

export default async function HospitalReportsPage() {
  await requireShop();
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#378ADD" }} /></div>}>
      <HospitalReports />
    </Suspense>
  );
}
