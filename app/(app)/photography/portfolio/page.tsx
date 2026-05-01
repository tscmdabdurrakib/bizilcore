import { requireShop } from "@/lib/getShop";
import { Suspense } from "react";
import PortfolioBoard from "./PortfolioBoard";
import { Loader2 } from "lucide-react";

export default async function PhotoPortfolioPage() {
  await requireShop();
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#DB2777" }} /></div>}>
      <PortfolioBoard />
    </Suspense>
  );
}
