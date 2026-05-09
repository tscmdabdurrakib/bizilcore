import { requireShop } from "@/lib/getShop";
import PrintReports from "./PrintReports";

export default async function PrintReportsPage() {
  await requireShop();
  return <PrintReports />;
}
