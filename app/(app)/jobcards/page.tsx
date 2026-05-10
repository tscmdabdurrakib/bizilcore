import { requireShop } from "@/lib/getShop";
import JobCardsBoard from "./JobCardsBoard";

export default async function JobCardsPage() {
  const { shop } = await requireShop();
  return <JobCardsBoard businessType={shop.businessType ?? "garage"} />;
}
