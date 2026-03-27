import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

interface Props { params: Promise<{ id: string }> }

export default async function LabelPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { shop: true },
  });

  if (!product || product.shop.userId !== session.user.id) notFound();

  const barcodeValue = product.sku || product.id.slice(-10).toUpperCase();
  const hasValidBarcode = barcodeValue.length >= 3;

  const LABEL_COUNT = 12;
  const labels = Array.from({ length: LABEL_COUNT });

  return (
    <>
      <div className="no-print" style={{ padding: "12px 24px", backgroundColor: "#1A1A18", display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ color: "#aaa", fontSize: "13px", flex: 1 }}>Label Print — {product.name}</span>
        <select id="labelCount" defaultValue="12"
          style={{ padding: "6px 12px", backgroundColor: "#333", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px" }}>
          <option value="1">১টি</option>
          <option value="4">৪টি</option>
          <option value="8">৮টি</option>
          <option value="12">১২টি</option>
          <option value="24">২৪টি</option>
        </select>
        <button id="printBtn"
          style={{ padding: "8px 20px", backgroundColor: "#0F6E56", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
          🖨️ Print Labels
        </button>
        <button onClick={undefined} id="closeBtn"
          style={{ padding: "8px 16px", backgroundColor: "#333", color: "#ccc", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>
          ✕ বন্ধ করুন
        </button>
      </div>

      <div style={{ padding: "24px", backgroundColor: "#e8e8e8", minHeight: "calc(100vh - 52px)" }}>
        <div id="label-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", maxWidth: "210mm", margin: "0 auto" }}>
          {labels.map((_, i) => (
            <div key={i} className="label-item" style={{
              backgroundColor: "#fff",
              border: "1px dashed #ccc",
              borderRadius: "6px",
              padding: "10px 12px",
              textAlign: "center",
              pageBreakInside: "avoid",
            }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#1A1A18", marginBottom: "6px", lineHeight: 1.3, wordBreak: "break-word" }}>
                {product.name}
              </p>
              {hasValidBarcode && (
                <svg className="barcode" data-value={barcodeValue} style={{ width: "100%", maxHeight: "48px" }} />
              )}
              <p style={{ fontSize: "10px", color: "#666", marginTop: "4px", letterSpacing: "0.5px" }}>
                {barcodeValue}
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "6px" }}>
                <div>
                  <p style={{ fontSize: "9px", color: "#999" }}>বিক্রয় মূল্য</p>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#0F6E56" }}>৳{product.sellPrice.toLocaleString("bn-BD")}</p>
                </div>
                {product.category && (
                  <div>
                    <p style={{ fontSize: "9px", color: "#999" }}>ক্যাটাগরি</p>
                    <p style={{ fontSize: "10px", color: "#555" }}>{product.category}</p>
                  </div>
                )}
              </div>
              <p style={{ fontSize: "9px", color: "#bbb", marginTop: "4px" }}>{product.shop.name}</p>
            </div>
          ))}
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        function initBarcodes() {
          if (typeof JsBarcode === 'undefined') {
            setTimeout(initBarcodes, 100);
            return;
          }
          document.querySelectorAll('.barcode').forEach(function(el) {
            try {
              JsBarcode(el, el.dataset.value, {
                format: 'CODE128',
                width: 1.5,
                height: 40,
                displayValue: false,
                margin: 2,
              });
            } catch(e) {}
          });
        }
        initBarcodes();

        document.getElementById('printBtn').addEventListener('click', function() { window.print(); });
        document.getElementById('closeBtn').addEventListener('click', function() { window.close(); });
      `}} />
    </>
  );
}
