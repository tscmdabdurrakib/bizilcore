import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;

    const invoice = await prisma.freelanceInvoice.findFirst({
      where: { token },
      include: {
        client: { select: { name: true, phone: true, address: true } },
        project: { select: { projectNumber: true, title: true } },
        shop: { select: { name: true, phone: true, address: true } },
      },
    });

    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Mark as viewed if still sent
    if (invoice.status === "sent") {
      await prisma.freelanceInvoice.update({
        where: { id: invoice.id },
        data: { status: "viewed", viewedAt: new Date() },
      });
    }

    return NextResponse.json(invoice);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
