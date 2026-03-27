import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FCommerceOrders from "@/components/orders/FCommerceOrders";
import RestaurantOrders from "@/components/orders/RestaurantOrders";
import TailorOrders from "@/components/orders/TailorOrders";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const shop = await prisma.shop.findUnique({
    where: { userId: session.user.id },
    select: { businessType: true },
  });

  if (shop?.businessType === "restaurant") {
    return <RestaurantOrders />;
  }

  if (shop?.businessType === "tailor") {
    return <TailorOrders />;
  }

  return <FCommerceOrders />;
}
