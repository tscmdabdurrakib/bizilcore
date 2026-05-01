import { requireShop } from "@/lib/getShop";
import { Suspense } from "react";
import VisaBoard from "./VisaBoard";
import { Loader2 } from "lucide-react";

export default async function TravelVisaPage() {
  await requireShop();
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#0891B2" }} /></div>}>
      <VisaBoard />
    </Suspense>
  );
}
