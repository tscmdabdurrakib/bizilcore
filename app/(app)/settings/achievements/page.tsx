import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AchievementsBoard from "./AchievementsBoard";

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--c-text)" }}>পদক ও অর্জন</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--c-text-muted)" }}>
          আপনার XP, লেভেল ও অর্জিত পদক দেখুন
        </p>
      </div>
      <AchievementsBoard />
    </div>
  );
}
