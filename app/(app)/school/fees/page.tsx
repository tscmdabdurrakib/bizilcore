import { requireShop } from "@/lib/getShop";
import FeesBoard from "./FeesBoard";

export default async function FeesPage() {
  await requireShop();
  return <FeesBoard />;
}
