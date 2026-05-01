import { requireShop } from "@/lib/getShop";
import { Suspense } from "react";
import MemberDetail from "./MemberDetail";
import { Loader2 } from "lucide-react";

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireShop();
  const { id } = await params;
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#7C3AED" }} /></div>}>
      <MemberDetail id={id} />
    </Suspense>
  );
}
