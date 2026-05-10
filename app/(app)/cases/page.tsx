import { requireShop } from "@/lib/getShop";
import CasesBoard from "./CasesBoard";

export default async function CasesPage() {
  await requireShop();
  return <CasesBoard />;
}
