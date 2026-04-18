import { redirect } from "next/navigation";

export default function CommunityTipsRedirect() {
  redirect("/community?tab=teamtips");
}
