import { requireShop } from "@/lib/getShop";
import HallsBoard from "./HallsBoard";

export default async function HallsPage() {
  await requireShop();
  return <HallsBoard />;
}
