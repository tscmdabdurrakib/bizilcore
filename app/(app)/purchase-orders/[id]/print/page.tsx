import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { POPrintToolbar } from "./PrintToolbar";
import { getPOStatusLabel } from "@/lib/purchase-orders/utils";

export default async function POPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const po = await prisma.purchaseOrder.findFirst({
    where: { id, shop: { userId: session.user.id } },
    include: {
      supplier: true,
      items: true,
      shop: {
        select: { name: true, phone: true, address: true, logoUrl: true },
      },
    },
  });

  if (!po) notFound();

  const date = new Date(po.createdAt).toLocaleDateString("bn-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <POPrintToolbar poNumber={po.poNumber} />

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
            padding: "40px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              {po.shop.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={po.shop.logoUrl} alt="" style={{ height: 48, marginBottom: 8 }} />
              )}
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111" }}>{po.shop.name}</h1>
              {po.shop.phone && (
                <p style={{ fontSize: 13, color: "#666" }}>📞 {po.shop.phone}</p>
              )}
              {po.shop.address && (
                <p style={{ fontSize: 13, color: "#666" }}>{po.shop.address}</p>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: "#0F6E56" }}>ক্রয় অর্ডার</h2>
              <p style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: "#333" }}>
                {po.poNumber}
              </p>
              <p style={{ fontSize: 13, color: "#666" }}>তারিখ: {date}</p>
              <p style={{ fontSize: 13, color: "#666" }}>
                স্ট্যাটাস: {getPOStatusLabel(po.status)}
              </p>
            </div>
          </div>

          {po.supplier && (
            <div
              style={{
                backgroundColor: "#F9FAFB",
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 4 }}>
                সরবরাহকারী
              </p>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>{po.supplier.name}</p>
              {po.supplier.phone && (
                <p style={{ fontSize: 13, color: "#666" }}>{po.supplier.phone}</p>
              )}
              {po.supplier.address && (
                <p style={{ fontSize: 13, color: "#666" }}>{po.supplier.address}</p>
              )}
            </div>
          )}

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
            <thead>
              <tr style={{ backgroundColor: "#F3F4F6" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 700 }}>
                  #
                </th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 700 }}>
                  পণ্য
                </th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, fontWeight: 700 }}>
                  পরিমাণ
                </th>
                <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 12, fontWeight: 700 }}>
                  একক মূল্য
                </th>
                <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 12, fontWeight: 700 }}>
                  মোট
                </th>
              </tr>
            </thead>
            <tbody>
              {po.items.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "10px 12px", fontSize: 13, color: "#666" }}>{idx + 1}</td>
                  <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600 }}>{item.name}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center", fontSize: 13 }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 13 }}>
                    ৳{item.unitPrice.toLocaleString("bn-BD")}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 13, fontWeight: 700 }}>
                    ৳{item.subtotal.toLocaleString("bn-BD")}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ padding: "12px", textAlign: "right", fontWeight: 700 }}>
                  মোট:
                </td>
                <td
                  style={{
                    padding: "12px",
                    textAlign: "right",
                    fontWeight: 900,
                    fontSize: 18,
                    color: "#0F6E56",
                  }}
                >
                  ৳{po.total.toLocaleString("bn-BD")}
                </td>
              </tr>
            </tfoot>
          </table>

          {po.expectedDate && (
            <p style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
              🗓️ প্রত্যাশিত ডেলিভারি:{" "}
              {new Date(po.expectedDate).toLocaleDateString("bn-BD", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}

          {po.notes && (
            <div
              style={{
                backgroundColor: "#FFFBEB",
                borderRadius: 8,
                padding: 12,
                fontSize: 13,
                color: "#92400E",
              }}
            >
              📝 {po.notes}
            </div>
          )}

          <div
            style={{
              marginTop: 48,
              paddingTop: 16,
              borderTop: "1px solid #E5E7EB",
              textAlign: "center",
              fontSize: 11,
              color: "#999",
            }}
          >
            BizilCore — {po.shop.name}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </>
  );
}
