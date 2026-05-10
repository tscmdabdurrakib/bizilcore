import { requireShop } from "@/lib/getShop";
import DevicesBoard from "./DevicesBoard";

export default async function DevicesPage() {
  await requireShop();
  return <DevicesBoard />;
}
