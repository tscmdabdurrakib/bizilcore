import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OnboardingWizard from "@/components/OnboardingWizard";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, shop] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.shop.findUnique({ where: { userId: session.user.id } }),
  ]);

  if (user?.onboarded && shop) {
    redirect("/dashboard");
  }

  return <OnboardingWizard shopName={shop?.name ?? ""} />;
}
