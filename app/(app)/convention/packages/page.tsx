import { requireShop } from "@/lib/getShop";
import PackagesBoard from "./PackagesBoard";

export default async function PackagesPage() {
  await requireShop();
  return <PackagesBoard />;
}
