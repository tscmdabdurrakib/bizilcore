import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/features";

export async function requireBusinessPlan(userId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const plan = (sub?.plan ?? "free") as PlanName;
  if (plan !== "business") {
    return { ok: false as const, plan, maxShops: PLAN_LIMITS.free.maxShops };
  }
  return { ok: true as const, plan, maxShops: PLAN_LIMITS.business.maxShops };
}

export async function getPrimaryShop(userId: string) {
  return prisma.shop.findUnique({ where: { userId } });
}

/** Resolve the shop the user is currently working in (primary or switched child shop). */
export async function resolveActiveShop(userId: string, activeShopId?: string | null) {
  const primaryShop = await getPrimaryShop(userId);
  if (!primaryShop) return { primaryShop: null, activeShop: null, accessibleShops: [] as AccessibleShopRow[] };

  const [memberships, childShops] = await Promise.all([
    prisma.shopMembership.findMany({
      where: { userId },
      include: { shop: { select: { id: true, name: true, logoUrl: true, parentShopId: true } } },
    }),
    prisma.shop.findMany({
      where: { parentShopId: primaryShop.id },
      select: { id: true, name: true, logoUrl: true, parentShopId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const accessibleMap = new Map<string, AccessibleShopRow>();
  accessibleMap.set(primaryShop.id, {
    id: primaryShop.id,
    name: primaryShop.name,
    logoUrl: primaryShop.logoUrl,
    isPrimary: true,
    isBranch: false,
    parentShopId: primaryShop.parentShopId,
    role: "owner",
  });

  for (const m of memberships) {
    if (m.shop.id === primaryShop.id) continue;
    accessibleMap.set(m.shop.id, {
      id: m.shop.id,
      name: m.shop.name,
      logoUrl: m.shop.logoUrl,
      isPrimary: false,
      isBranch: !!m.shop.parentShopId,
      parentShopId: m.shop.parentShopId,
      role: m.role,
    });
  }

  for (const child of childShops) {
    if (child.id === primaryShop.id || accessibleMap.has(child.id)) continue;
    accessibleMap.set(child.id, {
      id: child.id,
      name: child.name,
      logoUrl: child.logoUrl,
      isPrimary: false,
      isBranch: true,
      parentShopId: child.parentShopId,
      role: "owner",
    });
  }

  const accessibleShops = [...accessibleMap.values()];
  let activeShop = primaryShop;

  if (activeShopId && activeShopId !== primaryShop.id) {
    const match = accessibleShops.find(s => s.id === activeShopId);
    if (match) {
      const shop = await prisma.shop.findUnique({ where: { id: activeShopId } });
      if (shop) activeShop = shop;
    }
  }

  return { primaryShop, activeShop, accessibleShops };
}

export type AccessibleShopRow = {
  id: string;
  name: string;
  logoUrl: string | null;
  isPrimary: boolean;
  isBranch: boolean;
  parentShopId: string | null;
  role: string;
};

export async function getSessionActiveShopId() {
  const session = await auth();
  if (!session?.user?.id) return { session: null, activeShopId: null as string | null };
  const activeShopId = (session.user as { activeShopId?: string }).activeShopId ?? null;
  return { session, activeShopId };
}

export async function getActiveShopForApi() {
  const { session, activeShopId } = await getSessionActiveShopId();
  if (!session?.user?.id) return { error: "Unauthorized" as const };

  const { primaryShop, activeShop } = await resolveActiveShop(session.user.id, activeShopId);
  if (!primaryShop || !activeShop) return { error: "Shop not found" as const };

  const shopStatus = (activeShop as { shopStatus?: string }).shopStatus;
  if (shopStatus === "suspended") return { error: "Shop suspended" as const };

  return { session, primaryShop, activeShop, activeShopId: activeShop.id };
}

export async function userCanAccessShop(userId: string, shopId: string) {
  const { accessibleShops } = await resolveActiveShop(userId);
  return accessibleShops.some(s => s.id === shopId);
}

export async function ensureOrganization(userId: string, shopId: string, shopName: string) {
  let org = await prisma.organization.findUnique({ where: { ownerId: userId } });
  if (!org) {
    org = await prisma.organization.create({
      data: { ownerId: userId, name: shopName },
    });
    await prisma.shop.update({
      where: { id: shopId },
      data: { organizationId: org.id },
    });
  } else if (!(await prisma.shop.findFirst({ where: { id: shopId, organizationId: org.id } }))) {
    await prisma.shop.update({
      where: { id: shopId },
      data: { organizationId: org.id },
    });
  }
  return org;
}
