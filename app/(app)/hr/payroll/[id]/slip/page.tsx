import { Suspense } from "react";
import SalarySlipClient from "./SalarySlipClient";

export default function SalarySlipPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-400">লোড হচ্ছে...</div>}>
      <SalarySlipClient />
    </Suspense>
  );
}
