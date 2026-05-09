import { requireShop } from "@/lib/getShop";
import OwnersBoard from "./OwnersBoard";

export default async function OwnersPage() {
  await requireShop();
  return <OwnersBoard />;
}
