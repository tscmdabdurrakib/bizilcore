import { requireShop } from "@/lib/getShop";
import PetProfile from "./PetProfile";

export default async function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireShop();
  const { id } = await params;
  return <PetProfile id={id} />;
}
