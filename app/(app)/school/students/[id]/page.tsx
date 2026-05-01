import { requireShop } from "@/lib/getShop";
import StudentDetail from "./StudentDetail";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireShop();
  const { id } = await params;
  return <StudentDetail id={id} />;
}
