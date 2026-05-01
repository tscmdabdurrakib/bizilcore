import { requireShop } from "@/lib/getShop";
import { Suspense } from "react";
import BookingDetail from "./BookingDetail";
import { Loader2 } from "lucide-react";

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireShop();
  const { id } = await params;
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-20">
        <Loader2 size={28} className="animate-spin" style={{ color: "#DB2777" }} />
      </div>
    }>
      <BookingDetail id={id} />
    </Suspense>
  );
}
