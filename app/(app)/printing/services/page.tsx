import { requireShop } from "@/lib/getShop";
import PrintServicesBoard from "./PrintServicesBoard";

export default async function PrintServicesPage() {
  await requireShop();
  return <PrintServicesBoard />;
}
