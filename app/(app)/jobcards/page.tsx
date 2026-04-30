import { requireShop } from "@/lib/getShop";
import JobCardsBoard from "./JobCardsBoard";

export default async function JobCardsPage() {
  await requireShop();
  return <JobCardsBoard />;
}
