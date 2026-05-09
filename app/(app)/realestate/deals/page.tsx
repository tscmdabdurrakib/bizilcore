import { requireShop } from "@/lib/getShop";
import DealsBoard from "./DealsBoard";

export default async function DealsPage() {
  await requireShop();
  return <DealsBoard />;
}
