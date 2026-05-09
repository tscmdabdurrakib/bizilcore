import { requireShop } from "@/lib/getShop";
import LeadsBoard from "./LeadsBoard";

export default async function LeadsPage() {
  await requireShop();
  return <LeadsBoard />;
}
