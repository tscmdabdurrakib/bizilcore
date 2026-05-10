import { requireShop } from "@/lib/getShop";
import TimeLogBoard from "./TimeLogBoard";

export default async function TimeLogPage() {
  await requireShop();
  return <TimeLogBoard />;
}
