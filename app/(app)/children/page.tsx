import { requireShop } from "@/lib/getShop";
import ChildrenBoard from "./ChildrenBoard";

export default async function ChildrenPage() {
  await requireShop();
  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold" style={{ color: "var(--c-text)" }}>শিশু তালিকা</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--c-text-muted)" }}>নতুন শিশু ভর্তি ও তথ্য পরিচালনা</p>
      </div>
      <ChildrenBoard />
    </div>
  );
}
