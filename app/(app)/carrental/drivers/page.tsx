import { requireShop } from "@/lib/getShop";
import DriversBoard from "./DriversBoard";

export default async function DriversPage() {
  await requireShop();
  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold" style={{ color: "var(--c-text)" }}>ড্রাইভার ম্যানেজমেন্ট</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--c-text-muted)" }}>ড্রাইভারের তালিকা, লাইসেন্স ও বেতন পরিচালনা</p>
      </div>
      <DriversBoard />
    </div>
  );
}
