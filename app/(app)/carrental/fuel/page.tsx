import { requireShop } from "@/lib/getShop";
import FuelBoard from "./FuelBoard";

export default async function FuelPage() {
  await requireShop();
  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold" style={{ color: "var(--c-text)" }}>জ্বালানি লগ</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--c-text-muted)" }}>প্রতিটি গাড়ির জ্বালানি খরচ ট্র্যাক করুন</p>
      </div>
      <FuelBoard />
    </div>
  );
}
