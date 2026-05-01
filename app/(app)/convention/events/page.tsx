import { requireShop } from "@/lib/getShop";
import { Suspense } from "react";
import EventsBoard from "./EventsBoard";
import { Loader2 } from "lucide-react";

export default async function EventsPage() {
  await requireShop();
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-20">
        <Loader2 size={28} className="animate-spin" style={{ color: "#7C3AED" }} />
      </div>
    }>
      <EventsBoard />
    </Suspense>
  );
}
