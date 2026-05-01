import { Suspense } from "react";
import LivestockDetail from "./LivestockDetail";
import { Loader2 } from "lucide-react";

export default async function LivestockDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#16A34A" }} /></div>}>
      <LivestockDetail id={id} />
    </Suspense>
  );
}
