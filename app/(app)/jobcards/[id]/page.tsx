import { requireShop } from "@/lib/getShop";
import JobCardDetail from "./JobCardDetail";

export default async function JobCardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireShop();
  const { id } = await params;
  return <JobCardDetail id={id} />;
}
