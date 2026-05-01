import { requireShop } from "@/lib/getShop";
import EventDetail from "./EventDetail";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireShop();
  const { id } = await params;
  return <EventDetail id={id} />;
}
