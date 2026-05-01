import { requireShop } from "@/lib/getShop";
import SchoolReports from "./SchoolReports";

export default async function SchoolReportsPage() {
  await requireShop();
  return <SchoolReports />;
}
