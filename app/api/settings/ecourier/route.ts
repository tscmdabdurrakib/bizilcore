import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "eCourier is no longer supported. Use Steadfast instead." }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: "eCourier is no longer supported. Use Steadfast instead." }, { status: 410 });
}

export async function DELETE() {
  return NextResponse.json({ error: "eCourier is no longer supported. Use Steadfast instead." }, { status: 410 });
}
