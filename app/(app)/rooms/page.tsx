import { requireShop } from "@/lib/getShop";
import RoomsBoard from "./RoomsBoard";

export default async function RoomsPage() {
  await requireShop();
  return <RoomsBoard />;
}
