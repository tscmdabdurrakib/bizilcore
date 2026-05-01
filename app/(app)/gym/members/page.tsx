import { requireShop } from "@/lib/getShop";
import { Suspense } from "react";
import MembersBoard from "./MembersBoard";
import { Loader2 } from "lucide-react";

export default async function GymMembersPage() {
  await requireShop();
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#7C3AED" }} /></div>}>
      <MembersBoard />
    </Suspense>
  );
}
