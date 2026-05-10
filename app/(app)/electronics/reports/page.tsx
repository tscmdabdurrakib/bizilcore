import { requireShop } from "@/lib/getShop";
import ElectronicsReports from "./ElectronicsReports";

export default async function ElectronicsReportsPage() {
  await requireShop();
  return <ElectronicsReports />;
}
