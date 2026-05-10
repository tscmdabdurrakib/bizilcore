import { requireShop } from "@/lib/getShop";
import FleetBoard from "./FleetBoard";

export default async function FleetPage() {
  await requireShop();
  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold" style={{ color: "var(--c-text)" }}>ফ্লিট ম্যানেজমেন্ট</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--c-text-muted)" }}>গাড়ির তালিকা, স্ট্যাটাস ও রেট পরিচালনা</p>
      </div>
      <FleetBoard />
    </div>
  );
}
