import { requireShop } from "@/lib/getShop";
import PetsBoard from "./PetsBoard";

export default async function PetsPage() {
  await requireShop();
  return <PetsBoard />;
}
