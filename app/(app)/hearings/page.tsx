import { requireShop } from "@/lib/getShop";
import HearingsBoard from "./HearingsBoard";

export default async function HearingsPage() {
  await requireShop();
  return <HearingsBoard />;
}
