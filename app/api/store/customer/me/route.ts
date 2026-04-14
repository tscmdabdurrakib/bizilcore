import { NextResponse } from "next/server";
import { getStoreCustomer } from "@/lib/store-customer-auth";

export async function GET() {
  const customer = await getStoreCustomer();
  if (!customer) return NextResponse.json({ customer: null });
  return NextResponse.json({ customer });
}
