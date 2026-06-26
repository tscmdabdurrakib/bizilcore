import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSession, getShopContext } from "@/lib/getShop";
import FCommerceOrders from "@/components/orders/FCommerceOrders";
import RestaurantOrders from "@/components/orders/RestaurantOrders";
import TailorOrders from "@/components/orders/TailorOrders";
import LaundryOrders from "@/components/orders/LaundryOrders";

export default async function OrdersPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const activeShopId = (session.user as { activeShopId?: string }).activeShopId ?? null;
  const { shop } = await getShopContext(session.user.id, activeShopId);

  if (shop?.businessType === "restaurant") return <RestaurantOrders />;
  if (shop?.businessType === "tailor")     return <TailorOrders />;
  if (shop?.businessType === "laundry")    return <LaundryOrders />;

  return <FCommerceOrders />;
}
