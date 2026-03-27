import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

export default async function PackingSlipPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: { select: { name: true, sku: true } }, combo: { select: { name: true } } } },
      user: { include: { shop: true } },
    },
  });

  if (!order || order.userId !== session.user.id) notFound();

  const shop = order.user.shop;
  const date = new Date(order.createdAt).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" });

  return (
    <>
      <div className="no-print" style={{ padding: "12px 24px", backgroundColor: "#1A1A18", display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ color: "#aaa", fontSize: "13px", flex: 1 }}>Packing Slip — #{order.id.slice(-8).toUpperCase()}</span>
        <button id="printBtn"
          style={{ padding: "8px 20px", backgroundColor: "#0F6E56", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
          🖨️ Print
        </button>
        <button id="closeBtn"
          style={{ padding: "8px 16px", backgroundColor: "#333", color: "#ccc", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>
          ✕ বন্ধ করুন
        </button>
      </div>

      <div style={{ minHeight: "100vh", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px", backgroundColor: "#f0f0f0" }}>
        <div style={{
          width: "148mm", backgroundColor: "#fff", boxShadow: "0 4px 32px rgba(0,0,0,0.12)",
          borderRadius: "4px", padding: "20px 24px", fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif",
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px dashed #ccc", paddingBottom: "12px", marginBottom: "12px" }}>
            <div>
              <p style={{ fontSize: "16px", fontWeight: 700, color: "#1A1A18" }}>{shop?.name ?? "BizilCore Shop"}</p>
              {shop?.phone && <p style={{ fontSize: "11px", color: "#666" }}>📞 {shop.phone}</p>}
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#0F6E56", letterSpacing: "1px" }}>PACKING SLIP</p>
              <p style={{ fontSize: "11px", color: "#999" }}>#{order.id.slice(-8).toUpperCase()}</p>
              <p style={{ fontSize: "10px", color: "#999" }}>{date}</p>
            </div>
          </div>

          {/* Recipient */}
          <div style={{ backgroundColor: "#F7F6F2", borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>প্রাপকের তথ্য</p>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "#1A1A18", marginBottom: "3px" }}>{order.customer?.name ?? "অজানা"}</p>
            {order.customer?.phone && (
              <p style={{ fontSize: "13px", color: "#333", marginBottom: "2px" }}>📞 {order.customer.phone}</p>
            )}
            {order.customer?.address && (
              <p style={{ fontSize: "12px", color: "#555" }}>📍 {order.customer.address}</p>
            )}
          </div>

          {/* Courier info */}
          {(order.courierName || order.courierTrackId) && (
            <div style={{ border: "2px solid #0F6E56", borderRadius: "8px", padding: "10px", marginBottom: "12px" }}>
              <p style={{ fontSize: "10px", fontWeight: 700, color: "#0F6E56", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>কুরিয়ার তথ্য</p>
              {order.courierName && (
                <p style={{ fontSize: "12px", color: "#333", marginBottom: "3px" }}>
                  Courier: <strong>{({ pathao:"Pathao",ecourier:"eCourier",steadfast:"Steadfast",redx:"RedX",sundarban:"Sundarban",paperfly:"Paperfly",carrybee:"CarryBee",delivery_tiger:"Delivery Tiger",karatoa:"Karatoa (KCS)",janani:"Janani Express",sheba:"Sheba Delivery",sa_paribahan:"SA Paribahan" } as Record<string,string>)[order.courierName ?? ""] ?? order.courierName}</strong>
                </p>
              )}
              {order.courierTrackId && (
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#1A1A18", letterSpacing: "1px" }}>
                  Tracking: {order.courierTrackId}
                </p>
              )}
            </div>
          )}

          {/* Items */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "12px" }}>
            <thead>
              <tr style={{ backgroundColor: "#1A1A18" }}>
                <th style={{ padding: "6px 8px", textAlign: "left", color: "#fff", fontWeight: 600 }}>পণ্য</th>
                <th style={{ padding: "6px 8px", textAlign: "center", color: "#fff", fontWeight: 600 }}>SKU</th>
                <th style={{ padding: "6px 8px", textAlign: "right", color: "#fff", fontWeight: 600 }}>পরিমাণ</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={item.id} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#F7F6F2", borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "7px 8px", color: "#1A1A18", fontWeight: 500 }}>
                    {item.comboId
                      ? (item.comboSnapshot ? (() => { try { return (JSON.parse(item.comboSnapshot) as { name: string }).name; } catch { return item.combo?.name ?? "কমবো"; } })() : (item.combo?.name ?? "কমবো"))
                      : (item.product?.name ?? "পণ্য")}
                  </td>
                  <td style={{ padding: "7px 8px", textAlign: "center", color: "#999", fontSize: "11px", fontFamily: "monospace" }}>
                    {item.comboId ? "📦" : (item.product?.sku ?? "—")}
                  </td>
                  <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 700, color: "#0F6E56" }}>× {item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div style={{ borderTop: "2px dashed #ccc", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "11px", color: "#999" }}>মোট পণ্য</p>
              <p style={{ fontSize: "16px", fontWeight: 700, color: "#1A1A18" }}>
                {order.items.reduce((s, i) => s + i.quantity, 0)} পিস
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "11px", color: "#999" }}>COD পরিমাণ</p>
              <p style={{ fontSize: "18px", fontWeight: 700, color: "#E24B4A" }}>
                ৳{order.dueAmount > 0 ? order.dueAmount.toLocaleString("bn-BD") : "০"}
              </p>
            </div>
          </div>

          {order.note && (
            <div style={{ marginTop: "10px", padding: "8px 10px", backgroundColor: "#FFF3DC", borderRadius: "6px", fontSize: "11px", color: "#92600A" }}>
              <strong>নোট:</strong> {order.note}
            </div>
          )}

          <p style={{ marginTop: "12px", fontSize: "10px", color: "#ccc", textAlign: "center" }}>Powered by BizilCore</p>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
          div[style*="background-color: #f0f0f0"] { padding: 0 !important; background: none !important; }
        }
      `}</style>

      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('printBtn').addEventListener('click', function() { window.print(); });
        document.getElementById('closeBtn').addEventListener('click', function() { window.close(); });
      `}} />
    </>
  );
}
