import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PrintToolbar } from "./PrintToolbar";

export default async function ShopInvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, shop: { userId: session.user.id } },
    include: {
      customer: true,
      items: true,
      shop: {
        select: {
          name: true,
          phone: true,
          address: true,
          logoUrl: true,
          invoiceNote: true,
          bankAccount: true,
          bankName: true,
        },
      },
    },
  });

  if (!invoice) notFound();

  const shop = invoice.shop;
  const date = new Date(invoice.createdAt).toLocaleDateString("bn-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const hasBankInfo = shop?.bankAccount && shop?.bankName;
  const due = Math.max(0, invoice.total - invoice.paidAmount);

  return (
    <>
      <PrintToolbar invoiceNumber={invoice.invoiceNumber} invoiceId={id} />

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "32px 16px",
          backgroundColor: "#f0f0f0",
        }}
      >
        <div
          style={{
            width: "210mm",
            minHeight: "297mm",
            backgroundColor: "#fff",
            boxShadow: "0 4px 32px rgba(0,0,0,0.12)",
            borderRadius: "4px",
            padding: "40px 48px",
            fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "40px",
              borderBottom: "2px solid #0F6E56",
              paddingBottom: "24px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                {shop?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shop.logoUrl} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
                ) : (
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      backgroundColor: "#0F6E56",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "18px",
                    }}
                  >
                    {(shop?.name ?? "H")[0].toUpperCase()}
                  </div>
                )}
                <span style={{ fontSize: "22px", fontWeight: 700, color: "#1A1A18" }}>{shop?.name}</span>
              </div>
              {shop?.phone && <p style={{ fontSize: "13px", color: "#666" }}>📞 {shop.phone}</p>}
              {shop?.address && <p style={{ fontSize: "13px", color: "#666" }}>📍 {shop.address}</p>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "#0F6E56" }}>INVOICE</div>
              <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}># {invoice.invoiceNumber}</div>
              <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>তারিখ: {date}</div>
              {invoice.dueDate && (
                <div style={{ fontSize: "12px", color: "#E24B4A", marginTop: "4px" }}>
                  ডেডলাইন: {new Date(invoice.dueDate).toLocaleDateString("bn-BD")}
                </div>
              )}
            </div>
          </div>

          {invoice.customer && (
            <div style={{ marginBottom: "32px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: "8px" }}>
                বিলের প্রাপক
              </p>
              <p style={{ fontSize: "16px", fontWeight: 600 }}>{invoice.customer.name}</p>
              {invoice.customer.phone && <p style={{ fontSize: "13px", color: "#555" }}>📞 {invoice.customer.phone}</p>}
              {invoice.customer.address && <p style={{ fontSize: "13px", color: "#555" }}>📍 {invoice.customer.address}</p>}
            </div>
          )}

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: "#0F6E56" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#fff" }}>#</th>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#fff" }}>বিবরণ</th>
                <th style={{ padding: "10px 12px", textAlign: "right", color: "#fff" }}>একক মূল্য</th>
                <th style={{ padding: "10px 12px", textAlign: "right", color: "#fff" }}>পরিমাণ</th>
                <th style={{ padding: "10px 12px", textAlign: "right", color: "#fff" }}>মোট</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={item.id} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#F7F6F2" }}>
                  <td style={{ padding: "10px 12px", color: "#999" }}>{i + 1}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 500 }}>{item.description}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>{item.unitPrice.toLocaleString("bn-BD")}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>{item.quantity}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>{item.subtotal.toLocaleString("bn-BD")}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "32px" }}>
            <div style={{ width: "260px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", color: "#555", borderBottom: "1px solid #E8E6DF" }}>
                <span>সাবটোটাল</span>
                <span>৳{invoice.subtotal.toLocaleString("bn-BD")}</span>
              </div>
              {invoice.discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", color: "#555", borderBottom: "1px solid #E8E6DF" }}>
                  <span>ছাড়</span>
                  <span>− ৳{invoice.discount.toLocaleString("bn-BD")}</span>
                </div>
              )}
              {invoice.taxAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", color: "#555", borderBottom: "1px solid #E8E6DF" }}>
                  <span>VAT ({invoice.taxRate}%)</span>
                  <span>+ ৳{invoice.taxAmount.toLocaleString("bn-BD")}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: "16px", fontWeight: 700, color: "#0F6E56", borderBottom: "2px solid #0F6E56" }}>
                <span>মোট</span>
                <span>৳{invoice.total.toLocaleString("bn-BD")}</span>
              </div>
              {invoice.paidAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", color: "#22a06b" }}>
                  <span>পরিশোধিত</span>
                  <span>৳{invoice.paidAmount.toLocaleString("bn-BD")}</span>
                </div>
              )}
              {due > 0 && invoice.status !== "paid" && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px", fontWeight: 600, color: "#E24B4A" }}>
                  <span>বাকি</span>
                  <span>৳{due.toLocaleString("bn-BD")}</span>
                </div>
              )}
            </div>
          </div>

          {invoice.notes && (
            <div style={{ padding: "12px 16px", backgroundColor: "#F7F6F2", borderRadius: "8px", marginBottom: "16px", fontSize: "12px" }}>
              <strong>নোট:</strong> {invoice.notes}
            </div>
          )}

          {hasBankInfo && (
            <div style={{ padding: "14px 16px", backgroundColor: "#F0FBF6", borderRadius: "8px", marginBottom: "16px", border: "1px solid #C6E8DB" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#0F6E56", textTransform: "uppercase", marginBottom: "6px" }}>ব্যাংক তথ্য</p>
              <p style={{ fontSize: "13px", fontWeight: 600 }}>{shop!.bankName}</p>
              <p style={{ fontSize: "12px", fontFamily: "monospace" }}>{shop!.bankAccount}</p>
            </div>
          )}

          {shop?.invoiceNote && (
            <div style={{ padding: "12px 16px", backgroundColor: "#FFF3DC", borderRadius: "8px", marginBottom: "16px", fontSize: "12px", color: "#92600A", border: "1px solid #F0D87A" }}>
              {shop.invoiceNote}
            </div>
          )}

          <div style={{ marginTop: "32px", paddingTop: "16px", borderTop: "1px solid #E8E6DF", display: "flex", justifyContent: "space-between" }}>
            <p style={{ fontSize: "11px", color: "#aaa" }}>Powered by BizilCore</p>
            <p style={{ fontSize: "11px", color: "#aaa" }}>ধন্যবাদ!</p>
          </div>
        </div>
      </div>

      <style>{`@media print { .no-print { display: none !important; } }`}</style>
    </>
  );
}
