import { requireShop } from "@/lib/getShop";
import CarRentalReports from "./CarRentalReports";

export default async function CarRentalReportsPage() {
  await requireShop();
  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold" style={{ color: "var(--c-text)" }}>রিপোর্ট ও বিশ্লেষণ</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--c-text-muted)" }}>মাসিক আয়, গাড়ির পারফরম্যান্স ও জ্বালানি পরিসংখ্যান</p>
      </div>
      <CarRentalReports />
    </div>
  );
}
