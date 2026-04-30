import { requireShop } from "@/lib/getShop";
import VehiclesBoard from "./VehiclesBoard";

export default async function VehiclesPage() {
  await requireShop();
  return <VehiclesBoard />;
}
