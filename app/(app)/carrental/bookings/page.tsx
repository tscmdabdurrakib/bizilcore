import { requireShop } from "@/lib/getShop";
import BookingsBoard from "./BookingsBoard";

export default async function CarRentalBookingsPage() {
  await requireShop();
  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold" style={{ color: "var(--c-text)" }}>বুকিং ম্যানেজমেন্ট</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--c-text-muted)" }}>গাড়ি বুকিং, ট্রিপ শুরু ও শেষ এবং পেমেন্ট ট্র্যাকিং</p>
      </div>
      <BookingsBoard />
    </div>
  );
}
