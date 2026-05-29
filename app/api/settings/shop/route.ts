import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();
  return NextResponse.json(shop);
}

export async function PATCH(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();

  const {
    name,
    phone,
    email,
    address,
    logoUrl,
    photoStudioName,
    photoBookingPrefix,
    photoAutoSms,
    restOrderPrefix,
    restVatPct,
    restServiceChargePct,
    restKotAutoSend,
    restCurrency,
    restDefaultFloors,
    restDeliveryEnabled,
    restAutoStockDeduct,
    restRequireShift,
    laundryPrefix,
    laundryAutoSmsReady,
    laundryExpressMultiplier,
    laundryDefaultTurnaround,
    laundryAutoStockDeduct,
    receiptLogo,
    receiptHeaderLine1,
    receiptHeaderLine2,
    receiptFooter,
    receiptPaperSize,
    receiptShowVat,
    receiptShowQr,
    receiptShowLogo,
  } = body;

  const updated = await prisma.shop.update({
    where: { id: shop.id },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(address !== undefined && { address }),
      ...(logoUrl !== undefined && { logoUrl }),
      ...(photoStudioName !== undefined && { photoStudioName }),
      ...(photoBookingPrefix !== undefined && { photoBookingPrefix }),
      ...(photoAutoSms !== undefined && { photoAutoSms }),
      ...(restOrderPrefix !== undefined && { restOrderPrefix }),
      ...(restVatPct !== undefined && { restVatPct: Number(restVatPct) }),
      ...(restServiceChargePct !== undefined && { restServiceChargePct: Number(restServiceChargePct) }),
      ...(restKotAutoSend !== undefined && { restKotAutoSend }),
      ...(restCurrency !== undefined && { restCurrency }),
      ...(restDefaultFloors !== undefined && { restDefaultFloors }),
      ...(restDeliveryEnabled !== undefined && { restDeliveryEnabled }),
      ...(restAutoStockDeduct !== undefined && { restAutoStockDeduct }),
      ...(restRequireShift !== undefined && { restRequireShift }),
      ...(laundryPrefix !== undefined && { laundryPrefix }),
      ...(laundryAutoSmsReady !== undefined && { laundryAutoSmsReady }),
      ...(laundryExpressMultiplier !== undefined && { laundryExpressMultiplier }),
      ...(laundryDefaultTurnaround !== undefined && { laundryDefaultTurnaround }),
      ...(laundryAutoStockDeduct !== undefined && { laundryAutoStockDeduct }),
      ...(receiptLogo !== undefined && { receiptLogo }),
      ...(receiptHeaderLine1 !== undefined && { receiptHeaderLine1 }),
      ...(receiptHeaderLine2 !== undefined && { receiptHeaderLine2 }),
      ...(receiptFooter !== undefined && { receiptFooter }),
      ...(receiptPaperSize !== undefined && { receiptPaperSize }),
      ...(receiptShowVat !== undefined && { receiptShowVat }),
      ...(receiptShowQr !== undefined && { receiptShowQr }),
      ...(receiptShowLogo !== undefined && { receiptShowLogo }),
    },
  });

  return NextResponse.json(updated);
}
