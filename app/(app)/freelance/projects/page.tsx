import { requireShop } from "@/lib/getShop";
import ProjectsBoard from "./ProjectsBoard";

export default async function ProjectsPage() {
  await requireShop();
  return <ProjectsBoard />;
}
