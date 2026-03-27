import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CourierDelivery from "@/components/delivery/CourierDelivery";
import TailorDelivery from "@/components/delivery/TailorDelivery";

export default async function DeliveryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const shop = await prisma.shop.findUnique({
    where: { userId: session.user.id },
    select: { businessType: true },
  });

  if (shop?.businessType === "tailor") {
    return <TailorDelivery />;
  }

  return <CourierDelivery />;
}
