"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import MenuBoard from "@/components/restaurant/MenuBoard";

export default function RestaurantMenuPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <Loader2 size={28} className="animate-spin text-orange-600" />
      </div>
    }>
      <MenuBoard />
    </Suspense>
  );
}
