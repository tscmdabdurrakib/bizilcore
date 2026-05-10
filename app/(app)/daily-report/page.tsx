import { requireShop } from "@/lib/getShop";
import DailyReportBoard from "./DailyReportBoard";

export default async function DailyReportPage() {
  await requireShop();
  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold" style={{ color: "var(--c-text)" }}>ডেইলি রিপোর্ট</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--c-text-muted)" }}>প্রতিটি শিশুর দিনের রিপোর্ট তৈরি ও অভিভাবকদের পাঠান</p>
      </div>
      <DailyReportBoard />
    </div>
  );
}
