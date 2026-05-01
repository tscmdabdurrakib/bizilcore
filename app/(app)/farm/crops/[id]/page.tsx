import { Suspense } from "react";
import CropDetail from "./CropDetail";
import { Loader2 } from "lucide-react";

export default async function CropDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#16A34A" }} /></div>}>
      <CropDetail id={id} />
    </Suspense>
  );
}
