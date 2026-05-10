import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatBDT } from "@/lib/utils";

export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invoice = await prisma.freelanceInvoice.findFirst({
    where: { token },
    include: {
      client: { select: { name: true, phone: true, address: true } },
      project: { select: { projectNumber: true, title: true } },
      shop: { select: { name: true, phone: true, address: true } },
    },
  });

  if (!invoice) return notFound();

  // Mark as viewed
  if (invoice.status === "sent") {
    await prisma.freelanceInvoice.update({
      where: { id: invoice.id },
      data: { status: "viewed", viewedAt: new Date() },
    });
  }

  const items = (invoice.items as Array<{ description: string; quantity: number; rate: number; total: number }>) ?? [];
  const isOverdue = invoice.status !== "paid" && invoice.dueDate && new Date(invoice.dueDate) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 text-white" style={{ background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)" }}>
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

        {/* Invoice Info */}
        <div className="p-6">
          {/* Status badge */}
          {invoice.status === "paid" && (
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
              ✓ পেমেন্ট সম্পন্ন
            </div>
          )}
          {isOverdue && (
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-semibold">
              ⚠ Overdue
            </div>
          )}

          {/* Client & Date Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Invoice To</p>
              <p className="font-bold text-gray-800">{invoice.client.name}</p>
              {invoice.client.phone && <p className="text-gray-600 text-sm">{invoice.client.phone}</p>}
              {invoice.client.address && <p className="text-gray-600 text-sm">{invoice.client.address}</p>}
            </div>
            <div className="text-right">
              <div className="space-y-1">
                <div>
                  <p className="text-xs text-gray-400">Invoice Date</p>
                  <p className="font-medium text-gray-700">{new Date(invoice.createdAt).toLocaleDateString("en-GB")}</p>
                </div>
                {invoice.dueDate && (
                  <div>
                    <p className="text-xs text-gray-400">Due Date</p>
                    <p className={`font-medium ${isOverdue ? "text-red-600" : "text-gray-700"}`}>
                      {new Date(invoice.dueDate).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                )}
                {invoice.project && (
                  <div>
                    <p className="text-xs text-gray-400">Project</p>
                    <p className="font-medium text-gray-700 text-sm">{invoice.project.projectNumber}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items table */}
          <div className="rounded-xl overflow-hidden border border-gray-200 mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">বিবরণ</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Qty</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Rate</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-gray-700">{item.description}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{invoice.currency} {item.rate.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-700">{invoice.currency} {item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-700">{invoice.currency} {invoice.subtotal.toLocaleString()}</span>
              </div>
              {invoice.discountAmt > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ছাড়</span>
                  <span className="text-red-600">- {invoice.currency} {invoice.discountAmt.toLocaleString()}</span>
                </div>
              )}
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ট্যাক্স ({invoice.taxRate}%)</span>
                  <span className="text-gray-700">{invoice.currency} {invoice.taxAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2">
                <span className="text-gray-800">মোট</span>
                <span style={{ color: "#6366F1" }}>{invoice.currency} {invoice.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          {invoice.paymentNote && (
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 mb-6">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">পেমেন্ট নির্দেশনা</p>
              <p className="text-sm text-indigo-800 whitespace-pre-wrap">{invoice.paymentNote}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-gray-500 text-sm">Thank you for your business! 🙏</p>
          </div>
        </div>

        {/* Print button */}
        <div className="px-6 pb-6">
          <button
            onClick={() => window.print()}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm"
            style={{ background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)" }}
          >
            🖨 Print / Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
