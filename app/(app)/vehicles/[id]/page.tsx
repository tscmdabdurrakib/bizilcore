import { requireShop } from "@/lib/getShop";
import VehicleDetail from "./VehicleDetail";

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireShop();
  const { id } = await params;
  return <VehicleDetail id={id} />;
}
