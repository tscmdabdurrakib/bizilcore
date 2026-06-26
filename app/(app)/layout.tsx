import { redirect } from "next/navigation";
import { getSession, getShopContext } from "@/lib/getShop";
import AppSidebar from "@/components/AppSidebar";
import AppTopbar from "@/components/AppTopbar";
import AccountStatusModal from "@/components/AccountStatusModal";
import GrowthPrompts from "@/components/growth/GrowthPrompts";
import BadgeToast from "@/components/BadgeToast";
import ActivityTrackerProvider from "@/components/activity/ActivityTrackerProvider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const { shop, user, subscription: sub } = await getShopContext(
    session.user.id,
    (session.user as { activeShopId?: string }).activeShopId ?? null,
  );

  if (!shop || !user?.onboarded) redirect("/onboarding");

  return (
    <div className="flex h-screen overflow-hidden app-bg">
      <AppSidebar
        shopName={shop.name}
        plan={sub?.plan ?? "free"}
        isAdmin={user?.isAdmin ?? false}
        logoUrl={shop.logoUrl ?? null}
        businessType={shop.businessType ?? "fcommerce"}
        salesChannel={shop.salesChannel ?? "both"}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppTopbar shopId={shop.id} shopName={shop.name} logoUrl={shop.logoUrl ?? null} />
        <main className="app-main flex-1 overflow-y-auto pb-20 md:pb-5">
          <GrowthPrompts />
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
      {/* Show status popup if account is disabled or suspended */}
      {(user?.accountStatus === "disabled" || user?.accountStatus === "suspended") && (
        <AccountStatusModal
          accountStatus={user.accountStatus}
          statusReason={user.statusReason ?? null}
        />
      )}
      <BadgeToast />
      <ActivityTrackerProvider />
    </div>
  );
}
