import { requireShop } from "@/lib/getShop";
import ExamsBoard from "./ExamsBoard";

export default async function ExamsPage() {
  await requireShop();
  return <ExamsBoard />;
}
