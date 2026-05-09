import { requireShop } from "@/lib/getShop";
import PropertiesBoard from "./PropertiesBoard";

export default async function PropertiesPage() {
  await requireShop();
  return <PropertiesBoard />;
}
