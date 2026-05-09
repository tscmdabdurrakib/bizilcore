import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();
  return NextResponse.json({
    hospitalFacilityType: shop.hospitalFacilityType ?? "hospital",
    hospitalRegNumber: shop.hospitalRegNumber ?? "",
    hospitalEmergencyPhone: shop.hospitalEmergencyPhone ?? "",
    hospitalTokenResetTime: shop.hospitalTokenResetTime ?? "00:00",
    hospitalAdmissionPrefix: shop.hospitalAdmissionPrefix ?? "IPD",
    hospitalOpdPrefix: shop.hospitalOpdPrefix ?? "OPD",
    hospitalPatientPrefix: shop.hospitalPatientPrefix ?? "PAT",
    hospitalShowVitals: shop.hospitalShowVitals ?? true,
    hospitalAutoSms: shop.hospitalAutoSms ?? false,
  });
}

export async function PATCH(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();

  await prisma.shop.update({
    where: { id: shop.id },
    data: {
      ...(body.hospitalFacilityType !== undefined && { hospitalFacilityType: body.hospitalFacilityType }),
      ...(body.hospitalRegNumber !== undefined && { hospitalRegNumber: body.hospitalRegNumber }),
      ...(body.hospitalEmergencyPhone !== undefined && { hospitalEmergencyPhone: body.hospitalEmergencyPhone }),
      ...(body.hospitalTokenResetTime !== undefined && { hospitalTokenResetTime: body.hospitalTokenResetTime }),
      ...(body.hospitalAdmissionPrefix !== undefined && { hospitalAdmissionPrefix: body.hospitalAdmissionPrefix }),
      ...(body.hospitalOpdPrefix !== undefined && { hospitalOpdPrefix: body.hospitalOpdPrefix }),
      ...(body.hospitalPatientPrefix !== undefined && { hospitalPatientPrefix: body.hospitalPatientPrefix }),
      ...(body.hospitalShowVitals !== undefined && { hospitalShowVitals: body.hospitalShowVitals }),
      ...(body.hospitalAutoSms !== undefined && { hospitalAutoSms: body.hospitalAutoSms }),
    },
  });

  return NextResponse.json({ ok: true });
}
