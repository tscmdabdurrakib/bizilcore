import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatBDT } from "@/lib/utils";

export default async function PublicShopInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { token },
    include: {
      customer: { select: { name: true, phone: true, address: true } },
      items: true,
      shop: {
        select: {
          name: true,
          phone: true,
          address: true,
          invoiceNote: true,
          bankAccount: true,
          bankName: true,
        },
      },
    },
  });

  if (!invoice) return notFound();

  if (invoice.status === "sent") {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "sent", viewedAt: new Date() },
    }).catch(() => {});
  } else if (!invoice.viewedAt && ["sent", "overdue", "partial"].includes(invoice.status)) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { viewedAt: new Date() },
    }).catch(() => {});
  }

  const isOverdue =
    invoice.status !== "paid" &&
    invoice.status !== "cancelled" &&
    invoice.dueDate &&
    new Date(invoice.dueDate) < new Date();
  const due = Math.max(0, invoice.total - invoice.paidAmount);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 text-white" style={{ background: "linear-gradient(135deg, #0F6E56 0%, #065E48 100%)" }}>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">INVOICE</h1>
              <p className="text-white/80 text-sm mt-0.5">#{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">{invoice.shop.name}</p>
              {invoice.shop.phone && <p className="text-white/80 text-sm">{invoice.shop.phone}</p>}
              {invoice.shop.address && <p className="text-white/80 text-sm">{invoice.shop.address}</p>}
            </div>
          </div>
        </div>

        <div className="p-6">
          {invoice.status === "paid" && (
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
              ✓ পেমেন্ট সম্পন্ন
            </div>
          )}
          {isOverdue && (
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-semibold">
              ⚠ পেমেন্ট ডেডলাইন পার
            </div>
          )}

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Invoice To</p>
              <p className="font-bold text-gray-800">{invoice.customer?.name ?? "Guest"}</p>
              {invoice.customer?.phone && <p className="text-gray-600 text-sm">{invoice.customer.phone}</p>}
            </div>
            <div className="text-right">
              <div className="space-y-1">
                <div>
                  <p className="text-xs text-gray-400">Invoice Date</p>
                  <p className="font-medium text-gray-700">
                    {new Date(invoice.createdAt).toLocaleDateString("bn-BD")}
                  </p>
                </div>
                {invoice.dueDate && (
                  <div>
                    <p className="text-xs text-gray-400">Due Date</p>
                    <p className={`font-medium ${isOverdue ? "text-red-600" : "text-gray-700"}`}>
                      {new Date(invoice.dueDate).toLocaleDateString("bn-BD")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-emerald-600">
                <th className="text-left py-2 text-emerald-700">বিবরণ</th>
                <th className="text-center py-2 text-emerald-700">Qty</th>
                <th className="text-right py-2 text-emerald-700">Rate</th>
                <th className="text-right py-2 text-emerald-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-3">{item.description}</td>
                  <td className="py-3 text-center text-gray-500">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-500">{formatBDT(item.unitPrice)}</td>
                  <td className="py-3 text-right font-semibold">{formatBDT(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-2 text-sm border-t pt-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatBDT(invoice.subtotal)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Discount</span>
                <span>− {formatBDT(invoice.discount)}</span>
              </div>
            )}
            {invoice.taxAmount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>VAT ({invoice.taxRate}%)</span>
                <span>+ {formatBDT(invoice.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-black text-emerald-700 pt-2 border-t">
              <span>Total</span>
              <span>{formatBDT(invoice.total)}</span>
            </div>
            {invoice.paidAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Paid</span>
                <span>{formatBDT(invoice.paidAmount)}</span>
              </div>
            )}
            {due > 0 && invoice.status !== "paid" && (
              <div className="flex justify-between text-red-600 font-bold">
                <span>Due</span>
                <span>{formatBDT(due)}</span>
              </div>
            )}
          </div>

          {invoice.shop.bankName && invoice.shop.bankAccount && (
            <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-xs font-bold text-emerald-700 uppercase mb-1">Payment Info</p>
              <p className="font-semibold text-gray-800">{invoice.shop.bankName}</p>
              <p className="text-sm font-mono text-gray-600">{invoice.shop.bankAccount}</p>
            </div>
          )}

          {invoice.shop.invoiceNote && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 text-amber-800 text-sm border border-amber-100">
              {invoice.shop.invoiceNote}
            </div>
          )}

          {invoice.notes && (
            <p className="mt-4 text-sm text-gray-500">Note: {invoice.notes}</p>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 text-center text-xs text-gray-400 border-t">
          Powered by BizilCore
        </div>
      </div>
    </div>
  );
}
