import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function requireShop() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [shop, user] = await Promise.all([
    prisma.shop.findUnique({ where: { userId: session.user.id } }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ]);

  if (!shop || !user?.onboarded) redirect("/onboarding");

  return { session, shop, user };
}
