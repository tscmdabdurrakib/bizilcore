import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: true, combo: { select: { name: true } } } },
      user: { include: { shop: true } },
    },
  });

  if (!order || order.userId !== session.user.id) notFound();

  const shop = order.user.shop;
  const invoiceNo = `INV-${order.id.slice(-8).toUpperCase()}`;
  const date = new Date(order.createdAt).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" });
  const subtotal = order.items.reduce((s, i) => s + i.subtotal, 0);
  const hasBankInfo = shop?.bankAccount && shop?.bankName;

  return (
    <>
      {/* Print & Close buttons */}
      <div className="no-print" style={{ padding: "12px 24px", backgroundColor: "#1A1A18", display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ color: "#aaa", fontSize: "13px", flex: 1 }}>Invoice Preview — {invoiceNo}</span>
        <button
          onClick={() => window.print()}
          style={{ padding: "8px 20px", backgroundColor: "#0F6E56", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
        >
          🖨️ Print / PDF
        </button>
        <button
          onClick={() => window.close()}
          style={{ padding: "8px 16px", backgroundColor: "#333", color: "#ccc", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}
        >
          ✕ বন্ধ করুন
        </button>
      </div>

      <div style={{ minHeight: "100vh", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px", backgroundColor: "#f0f0f0" }}>
        <div style={{
          width: "210mm", minHeight: "297mm", backgroundColor: "#fff",
          boxShadow: "0 4px 32px rgba(0,0,0,0.12)", borderRadius: "4px",
          padding: "40px 48px", fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif",
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px", borderBottom: "2px solid #0F6E56", paddingBottom: "24px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{ width: "36px", height: "36px", backgroundColor: "#0F6E56", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "18px" }}>
                  {(shop?.name ?? "H")[0].toUpperCase()}
                </div>
                <span style={{ fontSize: "22px", fontWeight: 700, color: "#1A1A18" }}>{shop?.name ?? "BizilCore Shop"}</span>
              </div>
              {shop?.phone && <p style={{ fontSize: "13px", color: "#666", marginBottom: "2px" }}>📞 {shop.phone}</p>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "#0F6E56", letterSpacing: "1px" }}>INVOICE</div>
              <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}># {invoiceNo}</div>
              <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>তারিখ: {date}</div>
            </div>
          </div>

          {/* Bill To */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px", gap: "24px" }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>বিলের প্রাপক</p>
              <p style={{ fontSize: "16px", fontWeight: 600, color: "#1A1A18", marginBottom: "4px" }}>{order.customer?.name ?? "অজানা কাস্টমার"}</p>
              {order.customer?.phone && <p style={{ fontSize: "13px", color: "#555", marginBottom: "2px" }}>📞 {order.customer.phone}</p>}
              {order.customer?.address && <p style={{ fontSize: "13px", color: "#555" }}>📍 {order.customer.address}</p>}
            </div>
            <div style={{ flex: 1, textAlign: "right" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>অর্ডার তথ্য</p>
              <p style={{ fontSize: "13px", color: "#555", marginBottom: "4px" }}>স্ট্যাটাস: <span style={{ fontWeight: 600, color: order.status === "delivered" ? "#0F6E56" : "#EF9F27" }}>{order.status}</span></p>
              {order.courierTrackId && (
                <p style={{ fontSize: "12px", color: "#777", marginBottom: "2px" }}>Tracking: {order.courierTrackId}</p>
              )}
              {order.courierName && (
                <p style={{ fontSize: "12px", color: "#777" }}>Courier: {({ pathao:"Pathao",ecourier:"eCourier",steadfast:"Steadfast",redx:"RedX",sundarban:"Sundarban",paperfly:"Paperfly",carrybee:"CarryBee",delivery_tiger:"Delivery Tiger",karatoa:"Karatoa (KCS)",janani:"Janani Express",sheba:"Sheba Delivery",sa_paribahan:"SA Paribahan" } as Record<string,string>)[order.courierName ?? ""] ?? order.courierName}</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: "#0F6E56" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#fff", fontWeight: 600, borderRadius: "4px 0 0 0" }}>#</th>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#fff", fontWeight: 600 }}>পণ্যের নাম</th>
                <th style={{ padding: "10px 12px", textAlign: "right", color: "#fff", fontWeight: 600 }}>মূল্য (৳)</th>
                <th style={{ padding: "10px 12px", textAlign: "right", color: "#fff", fontWeight: 600 }}>পরিমাণ</th>
                <th style={{ padding: "10px 12px", textAlign: "right", color: "#fff", fontWeight: 600, borderRadius: "0 4px 0 0" }}>সাবটোটাল (৳)</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={item.id} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#F7F6F2" }}>
                  <td style={{ padding: "10px 12px", color: "#999" }}>{i + 1}</td>
                  <td style={{ padding: "10px 12px", color: "#1A1A18", fontWeight: 500 }}>
                    {item.comboId
                      ? (item.comboSnapshot ? (() => { try { return (JSON.parse(item.comboSnapshot) as { name: string }).name; } catch { return item.combo?.name ?? "কমবো"; } })() : (item.combo?.name ?? "কমবো"))
                      : (item.product?.name ?? "পণ্য")}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#555" }}>{item.unitPrice.toLocaleString("bn-BD")}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#555" }}>{item.quantity}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#1A1A18", fontWeight: 600 }}>{item.subtotal.toLocaleString("bn-BD")}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "32px" }}>
            <div style={{ width: "260px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", color: "#555", borderBottom: "1px solid #E8E6DF" }}>
                <span>সাবটোটাল</span>
                <span>৳{subtotal.toLocaleString("bn-BD")}</span>
              </div>
              {order.deliveryCharge > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", color: "#555", borderBottom: "1px solid #E8E6DF" }}>
                  <span>ডেলিভারি চার্জ</span>
                  <span>৳{order.deliveryCharge.toLocaleString("bn-BD")}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: "16px", fontWeight: 700, color: "#0F6E56", borderBottom: "2px solid #0F6E56" }}>
                <span>মোট</span>
                <span>৳{order.totalAmount.toLocaleString("bn-BD")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", color: "#22a06b" }}>
                <span>পরিশোধিত</span>
                <span>৳{order.paidAmount.toLocaleString("bn-BD")}</span>
              </div>
              {order.dueAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px", fontWeight: 600, color: "#E24B4A" }}>
                  <span>বাকি</span>
                  <span>৳{order.dueAmount.toLocaleString("bn-BD")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Note */}
          {order.note && (
            <div style={{ padding: "12px 16px", backgroundColor: "#F7F6F2", borderRadius: "8px", marginBottom: "16px", fontSize: "12px", color: "#666" }}>
              <strong>নোট:</strong> {order.note}
            </div>
          )}

          {/* Bank Account Info */}
          {hasBankInfo && (
            <div style={{ padding: "14px 16px", backgroundColor: "#F0FBF6", borderRadius: "8px", marginBottom: "16px", border: "1px solid #C6E8DB" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#0F6E56", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>ব্যাংক তথ্য (Payment)</p>
              <p style={{ fontSize: "13px", color: "#1A1A18", fontWeight: 600 }}>{shop!.bankName}</p>
              <p style={{ fontSize: "12px", color: "#555", fontFamily: "monospace", marginTop: "2px" }}>{shop!.bankAccount}</p>
            </div>
          )}

          {/* Custom Invoice Note */}
          {shop?.invoiceNote && (
            <div style={{ padding: "12px 16px", backgroundColor: "#FFF3DC", borderRadius: "8px", marginBottom: "16px", fontSize: "12px", color: "#92600A", border: "1px solid #F0D87A" }}>
              {shop.invoiceNote}
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: "32px", paddingTop: "16px", borderTop: "1px solid #E8E6DF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: "11px", color: "#aaa" }}>Powered by BizilCore</p>
            <p style={{ fontSize: "11px", color: "#aaa" }}>ধন্যবাদ আপনার ক্রয়ের জন্য!</p>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        document.querySelectorAll('button').forEach(btn => {
          if (btn.textContent.includes('Print')) btn.addEventListener('click', () => window.print());
          if (btn.textContent.includes('বন্ধ')) btn.addEventListener('click', () => window.close());
        });
      `}} />
    </>
  );
}
