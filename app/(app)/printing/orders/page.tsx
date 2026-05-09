import { requireShop } from "@/lib/getShop";
import PrintOrdersBoard from "./PrintOrdersBoard";

export default async function PrintOrdersPage() {
  await requireShop();
  return <PrintOrdersBoard />;
}
