import { requireShop } from "@/lib/getShop";
import { Suspense } from "react";
import BillingBoard from "./BillingBoard";
import { Loader2 } from "lucide-react";

export default async function BillingPage() {
  await requireShop();
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#378ADD" }} /></div>}>
      <BillingBoard />
    </Suspense>
  );
}
