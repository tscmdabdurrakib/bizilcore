import { requireShop } from "@/lib/getShop";
import MealsBoard from "./MealsBoard";

export default async function MealsPage() {
  await requireShop();
  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold" style={{ color: "var(--c-text)" }}>খাবার ট্র্যাকিং</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--c-text-muted)" }}>প্রতিটি শিশুর খাবারের তথ্য রেকর্ড করুন</p>
      </div>
      <MealsBoard />
    </div>
  );
}
