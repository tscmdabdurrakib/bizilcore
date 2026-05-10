import { requireShop } from "@/lib/getShop";
import ProjectDetail from "./ProjectDetail";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireShop();
  const { id } = await params;
  return <ProjectDetail projectId={id} />;
}
