import { requireShop } from "@/lib/getShop";
import InvoicesBoard from "./InvoicesBoard";

export default async function InvoicesPage() {
  await requireShop();
  return <InvoicesBoard />;
}
