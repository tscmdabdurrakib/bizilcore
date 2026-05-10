import { requireShop } from "@/lib/getShop";
import LegalReports from "./LegalReports";

export default async function LegalReportsPage() {
  await requireShop();
  return <LegalReports />;
}
