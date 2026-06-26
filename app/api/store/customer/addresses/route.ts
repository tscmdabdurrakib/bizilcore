import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStoreCustomer } from "@/lib/store-customer-auth";

export async function GET(req: Request) {
  const customer = await getStoreCustomer();
  if (!customer) return NextResponse.json({ addresses: [] });

  const addresses = await prisma.storeCustomerAddress.findMany({
    where: { storeCustomerId: customer.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ addresses });
}

export async function POST(req: Request) {
  const customer = await getStoreCustomer();
  if (!customer) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { label, address, district, upazila, isDefault } = await req.json();
  if (!address) return NextResponse.json({ error: "Address required" }, { status: 400 });

  if (isDefault) {
    await prisma.storeCustomerAddress.updateMany({
      where: { storeCustomerId: customer.id },
      data: { isDefault: false },
    });
  }

  const created = await prisma.storeCustomerAddress.create({
    data: {
      storeCustomerId: customer.id,
      label: label || null,
      address,
      district: district || null,
      upazila: upazila || null,
      isDefault: !!isDefault,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
