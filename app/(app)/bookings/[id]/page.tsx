import { requireShop } from "@/lib/getShop";
import BookingDetail from "./BookingDetail";

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireShop();
  const { id } = await params;
  return <BookingDetail bookingId={id} />;
}
