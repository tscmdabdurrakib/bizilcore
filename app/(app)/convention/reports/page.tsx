import { requireShop } from "@/lib/getShop";
import ConventionReports from "./ConventionReports";

export default async function ConventionReportsPage() {
  await requireShop();
  return <ConventionReports />;
}
