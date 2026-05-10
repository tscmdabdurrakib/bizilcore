import { requireShop } from "@/lib/getShop";
import KindergartenReports from "./KindergartenReports";

export default async function KindergartenReportsPage() {
  await requireShop();
  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold" style={{ color: "var(--c-text)" }}>কিন্ডারগার্টেন রিপোর্ট</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--c-text-muted)" }}>উপস্থিতি, খাবার, ফি ও সামগ্রিক বিশ্লেষণ</p>
      </div>
      <KindergartenReports />
    </div>
  );
}
