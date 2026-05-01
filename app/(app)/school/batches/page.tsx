import { requireShop } from "@/lib/getShop";
import BatchesBoard from "./BatchesBoard";

export default async function BatchesPage() {
  await requireShop();
  return <BatchesBoard />;
}
