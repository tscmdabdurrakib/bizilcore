import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AppSidebar from "@/components/AppSidebar";
import AppTopbar from "@/components/AppTopbar";
import AccountStatusModal from "@/components/AccountStatusModal";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [shop, user, sub] = await Promise.all([
    prisma.shop.findUnique({ where: { userId: session.user.id } }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.subscription.findUnique({ where: { userId: session.user.id } }),
  ]);

  if (!shop || !user?.onboarded) redirect("/onboarding");

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--shell-outer-bg)" }}>
      <AppSidebar
        shopName={shop.name}
        plan={sub?.plan ?? "free"}
        isAdmin={user?.isAdmin ?? false}
        logoUrl={shop.logoUrl ?? null}
        businessType={shop.businessType ?? "fcommerce"}
        salesChannel={shop.salesChannel ?? "both"}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppTopbar />
        <main className="app-main flex-1 overflow-y-auto p-5 pb-20 md:pb-5">
          {children}
        </main>
      </div>
      {/* Show status popup if account is disabled or suspended */}
      {(user?.accountStatus === "disabled" || user?.accountStatus === "suspended") && (
        <AccountStatusModal
          accountStatus={user.accountStatus}
          statusReason={user.statusReason ?? null}
        />
      )}
    </div>
  );
}
