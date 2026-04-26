import { requireShop } from "@/lib/getShop";
import BookingsBoard from "./BookingsBoard";

export default async function BookingsPage() {
  await requireShop();
  return <BookingsBoard />;
}
