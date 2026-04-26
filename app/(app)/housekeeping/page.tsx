import { requireShop } from "@/lib/getShop";
import HousekeepingBoard from "./HousekeepingBoard";

export default async function HousekeepingPage() {
  await requireShop();
  return <HousekeepingBoard />;
}
