import { requireShop } from "@/lib/getShop";
import CaseDetail from "./CaseDetail";

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireShop();
  const { id } = await params;
  return <CaseDetail id={id} />;
}
