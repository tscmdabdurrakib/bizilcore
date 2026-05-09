import { requireShop } from "@/lib/getShop";
import PetShopReports from "./PetShopReports";

export default async function PetShopReportsPage() {
  await requireShop();
  return <PetShopReports />;
}
