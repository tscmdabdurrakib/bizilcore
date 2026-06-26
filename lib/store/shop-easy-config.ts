import { prisma } from "@/lib/prisma";

export type DeliverySlot = { label: string; value: string };
export type OrderStatusTemplate = {
  id: string;
  label: string;
  statusKey?: string;
  message: string;
};

type EasyConfig = {
  deliverySlots?: DeliverySlot[];
  orderStatusTemplates?: OrderStatusTemplate[];
};

export function parseEasyConfig(raw: unknown): EasyConfig {
  if (!raw || typeof raw !== "object") return {};
  const cfg = raw as EasyConfig;
  return {
    deliverySlots: Array.isArray(cfg.deliverySlots) ? cfg.deliverySlots : [],
    orderStatusTemplates: Array.isArray(cfg.orderStatusTemplates) ? cfg.orderStatusTemplates : [],
  };
}

export async function getShopEasyConfig(shopId: string): Promise<EasyConfig> {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { businessConfig: true },
  });
  return parseEasyConfig(shop?.businessConfig);
}

export async function updateShopEasyConfig(shopId: string, patch: Partial<EasyConfig>) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { businessConfig: true },
  });
  const current = parseEasyConfig(shop?.businessConfig);
  const merged = { ...current, ...patch };
  await prisma.shop.update({
    where: { id: shopId },
    data: { businessConfig: merged as object },
  });
  return merged;
}
