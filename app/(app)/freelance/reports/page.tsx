import { requireShop } from "@/lib/getShop";
import FreelanceReports from "./FreelanceReports";

export default async function ReportsPage() {
  await requireShop();
  return <FreelanceReports />;
}
