import { requireShop } from "@/lib/getShop";
import { Suspense } from "react";
import BookingsBoard from "./BookingsBoard";
import { Loader2 } from "lucide-react";

export default async function PhotoBookingsPage() {
  await requireShop();
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-20">
        <Loader2 size={28} className="animate-spin" style={{ color: "#DB2777" }} />
      </div>
    }>
      <BookingsBoard />
    </Suspense>
  );
}
