import { requireShop } from "@/lib/getShop";
import RealEstateReports from "./RealEstateReports";

export default async function RealEstateReportsPage() {
  await requireShop();
  return <RealEstateReports />;
}
