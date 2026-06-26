import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AchievementsBoard from "./AchievementsBoard";
import { PageShell } from "@/components/ui";

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <PageShell
      title="পদক ও অর্জন"
      subtitle="আপনার XP, লেভেল ও অর্জিত পদক দেখুন"
      className="max-w-3xl"
    >
      <AchievementsBoard />
    </PageShell>
  );
}
