import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SalonServices from "@/components/services/SalonServices";
import LaundryServices from "@/components/services/LaundryServices";

export default async function ServicesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const shop = await prisma.shop.findUnique({
    where: { userId: session.user.id },
    select: { businessType: true },
  });

  if (shop?.businessType === "laundry") return <LaundryServices />;

  return <SalonServices />;
}
