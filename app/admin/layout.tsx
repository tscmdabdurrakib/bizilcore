import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "👥 Users" },
  { href: "/admin/promo-codes", label: "🎟 Promo Codes" },
  { href: "/admin/affiliates", label: "💰 Affiliates" },
  { href: "/admin/community-tips", label: "💡 Community Tips" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.isAdmin) redirect("/dashboard");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F6F2" }}>
      <header className="border-b px-6 h-14 flex items-center justify-between sticky top-0 z-30" style={{ backgroundColor: "#1A1A18", borderColor: "#333" }}>
        <div className="flex items-center gap-4">
          <span className="font-bold text-white text-lg">BizilCore Admin</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#0F6E56", color: "#fff" }}>Super Admin</span>
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="text-sm px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10" style={{ color: "#D1D5DB" }}>
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm" style={{ color: "#A8A69E" }}>← ফিরে যান</Link>
        </div>
      </header>
      <main className="p-6 max-w-6xl mx-auto">
        {children}
      </main>
    </div>
  );
}
