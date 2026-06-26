import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminShell from "./components/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  if ((session.user as { realAdminId?: string }).realAdminId) redirect("/dashboard");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true, name: true, email: true },
  });
  if (!user?.isAdmin) redirect("/dashboard");

  return (
    <AdminShell adminName={user.name} adminEmail={user.email}>
      {children}
    </AdminShell>
  );
}
