export interface ReceiptShop {
  name: string;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  receiptLogo?: string | null;
  receiptHeaderLine1?: string | null;
  receiptHeaderLine2?: string | null;
  receiptFooter?: string | null;
  receiptPaperSize?: string | null;
  receiptShowVat?: boolean;
  receiptShowQr?: boolean;
  receiptShowLogo?: boolean;
}

export interface ReceiptItem {
  quantity: number;
  unitPrice: number;
  isVoided?: boolean;
  menuItem: { name: string };
  note?: string | null;
}

export interface ReceiptSplit {
  payerName?: string | null;
  amount: number;
  paymentMethod: string;
}

export interface ReceiptOrder {
  orderNumber: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  subtotal: number;
  vatAmount: number;
  serviceAmount: number;
  discount: number;
  tipAmount?: number | null;
  paymentMethod?: string | null;
  customerName?: string | null;
  createdAt: string | Date;
  table?: { number: number; floor: string } | null;
  waiter?: { user: { name: string } } | null;
  splits?: ReceiptSplit[];
}

const PAY_LABELS: Record<string, string> = {
  cash: "নগদ", card: "কার্ড", bkash: "বিকাশ",
  nagad: "নগদ অ্যাপ", bank: "ব্যাংক", other: "অন্যান্য",
};

function fmtBDT(n: number) {
  return `৳${n.toFixed(2)}`;
}

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleString("bn-BD", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function buildReceiptHtml(
  order: ReceiptOrder,
  shop: ReceiptShop,
  qrDataUrl: string | null
): string {
  const paper = shop.receiptPaperSize ?? "80mm";
  const isA4 = paper === "A4";
  const width = paper === "58mm" ? "58mm" : paper === "A4" ? "210mm" : "80mm";
  const fontSize = paper === "58mm" ? "10px" : "12px";
  const logoUrl = shop.receiptShowLogo ? (shop.receiptLogo ?? shop.logoUrl) : null;
  const activeItems = order.items?.filter((i: ReceiptItem) => !i.isVoided) ?? [];
  const due = Math.max(0, order.totalAmount - order.paidAmount);

  const itemRows = activeItems.map((item: ReceiptItem) => `
    <tr>
      <td style="padding:2px 0">${item.menuItem.name}${item.note ? ` <em style="font-size:0.85em;color:#666">(${item.note})</em>` : ""}</td>
      <td style="text-align:center;padding:2px 4px">${item.quantity}</td>
      <td style="text-align:right;padding:2px 0">${fmtBDT(item.unitPrice)}</td>
      <td style="text-align:right;padding:2px 0;font-weight:600">${fmtBDT(item.quantity * item.unitPrice)}</td>
    </tr>
  `).join("");

  const payLines = order.splits && order.splits.length > 0
    ? order.splits.map((sp: ReceiptSplit) => `
        <div class="row"><span>${PAY_LABELS[sp.paymentMethod] ?? sp.paymentMethod}${sp.payerName ? ` (${sp.payerName})` : ""}</span><span>${fmtBDT(sp.amount)}</span></div>
      `).join("")
    : `<div class="row"><span>${PAY_LABELS[order.paymentMethod ?? "cash"] ?? order.paymentMethod}</span><span>${fmtBDT(order.paidAmount)}</span></div>`;

  return `<!DOCTYPE html><html><head>
    <meta charset="utf-8">
    <title>রসিদ — ${order.orderNumber}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Courier New', monospace;
        font-size: ${fontSize};
        width: ${width};
        max-width: ${width};
        padding: ${isA4 ? "20mm 15mm" : "8px"};
        color: #000;
      }
      .center { text-align: center; }
      .bold { font-weight: bold; }
      .line-dashed { border-top: 1px dashed #000; margin: 5px 0; }
      .line-solid { border-top: 1px solid #000; margin: 5px 0; }
      .row { display: flex; justify-content: space-between; align-items: flex-start; margin: 2px 0; }
      .row-bold { display: flex; justify-content: space-between; font-weight: bold; margin: 3px 0; font-size: 1.05em; }
      .due { color: #b91c1c; font-weight: bold; }
      .paid { color: #15803d; font-weight: bold; }
      table { width: 100%; border-collapse: collapse; font-size: ${fontSize}; }
      th { text-align: left; border-bottom: 1px solid #000; padding: 3px 0; font-size: 0.85em; }
      th:nth-child(2) { text-align: center; }
      th:nth-child(3), th:nth-child(4) { text-align: right; }
      .logo { max-width: ${paper === "58mm" ? "80px" : "100px"}; max-height: 60px; object-fit: contain; margin: 0 auto 6px; display: block; }
      .qr { display: block; margin: 6px auto 0; width: 80px; height: 80px; }
      @media print {
        button, .no-print { display: none !important; }
        body { padding: ${isA4 ? "10mm 15mm" : "0"}; }
        @page { size: ${isA4 ? "A4" : `${width} auto`}; margin: 0; }
      }
    </style>
  </head><body>

    ${logoUrl ? `<img src="${logoUrl}" class="logo" alt="Logo" onerror="this.style.display='none'" />` : ""}
    <div class="center bold" style="font-size:1.15em;margin-bottom:2px">${shop.name}</div>
    ${shop.receiptHeaderLine1 ? `<div class="center" style="font-size:0.9em">${shop.receiptHeaderLine1}</div>` : ""}
    ${shop.receiptHeaderLine2 ? `<div class="center" style="font-size:0.9em">${shop.receiptHeaderLine2}</div>` : ""}
    ${shop.phone ? `<div class="center" style="font-size:0.85em">${shop.phone}</div>` : ""}
    ${shop.address ? `<div class="center" style="font-size:0.85em">${shop.address}</div>` : ""}

    <div class="line-dashed"></div>

    <div class="row"><span>অর্ডার নম্বর</span><span class="bold">${order.orderNumber}</span></div>
    <div class="row"><span>তারিখ/সময়</span><span>${fmtDate(order.createdAt)}</span></div>
    ${order.table ? `<div class="row"><span>টেবিল</span><span>${order.table.number} (${order.table.floor})</span></div>` : ""}
    ${order.waiter ? `<div class="row"><span>ওয়েটার</span><span>${order.waiter.user.name}</span></div>` : ""}
    ${order.customerName ? `<div class="row"><span>কাস্টমার</span><span>${order.customerName}</span></div>` : ""}

    <div class="line-dashed"></div>

    <table>
      <thead>
        <tr>
          <th>আইটেম</th><th style="text-align:center">পরিমাণ</th>
          <th style="text-align:right">দাম</th><th style="text-align:right">মোট</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div class="line-dashed"></div>

    <div class="row"><span>সাব-টোটাল</span><span>${fmtBDT(order.subtotal)}</span></div>
    ${order.discount > 0 ? `<div class="row"><span>ছাড়</span><span>- ${fmtBDT(order.discount)}</span></div>` : ""}
    ${shop.receiptShowVat && order.vatAmount > 0 ? `<div class="row"><span>VAT</span><span>${fmtBDT(order.vatAmount)}</span></div>` : ""}
    ${shop.receiptShowVat && order.serviceAmount > 0 ? `<div class="row"><span>সার্ভিস চার্জ</span><span>${fmtBDT(order.serviceAmount)}</span></div>` : ""}
    ${order.tipAmount && order.tipAmount > 0 ? `<div class="row"><span>টিপ</span><span>${fmtBDT(order.tipAmount)}</span></div>` : ""}

    <div class="line-solid"></div>
    <div class="row-bold"><span>সর্বমোট</span><span>${fmtBDT(order.totalAmount)}</span></div>
    <div class="line-solid"></div>

    <div style="margin:4px 0 2px;font-size:0.85em;font-weight:600">পেমেন্ট:</div>
    ${payLines}
    ${due > 0
      ? `<div class="row due"><span>বকেয়া</span><span>${fmtBDT(due)}</span></div>`
      : `<div class="row paid"><span>সম্পূর্ণ পরিশোধিত</span><span>✓</span></div>`
    }

    ${shop.receiptShowQr && qrDataUrl ? `
    <div class="line-dashed"></div>
    <div class="center" style="font-size:0.8em;margin-bottom:3px">স্ক্যান করে অর্ডার যাচাই করুন</div>
    <img src="${qrDataUrl}" class="qr" alt="QR" />
    ` : ""}

    <div class="line-dashed"></div>
    <div class="center" style="margin-top:4px;font-size:0.9em">${shop.receiptFooter ?? "ধন্যবাদ! আবার আসবেন।"}</div>

    <div class="no-print" style="text-align:center;margin-top:16px">
      <button onclick="window.print()" style="padding:8px 24px;font-size:14px;cursor:pointer;border:1px solid #ccc;border-radius:6px">🖨️ প্রিন্ট করুন</button>
      <button onclick="window.close()" style="padding:8px 16px;font-size:14px;cursor:pointer;border:1px solid #ccc;border-radius:6px;margin-left:8px">বন্ধ করুন</button>
    </div>

  </body></html>`;
}

export function buildKotHtml(
  order: {
    orderNumber: string;
    createdAt: string | Date;
    note?: string | null;
    table?: { number: number; floor: string } | null;
    waiter?: { user: { name: string } } | null;
    items: ReceiptItem[];
  },
  kotNumber?: string
): string {
  const activeItems = order.items.filter(i => !i.isVoided);
  const itemRows = activeItems.map(item => `
    <div class="kot-item">
      <span class="qty">${item.quantity}×</span>
      <span class="name">${item.menuItem.name}</span>
      ${item.note ? `<div class="note">📝 ${item.note}</div>` : ""}
    </div>
  `).join('<div class="divider"></div>');

  return `<!DOCTYPE html><html><head>
    <meta charset="utf-8">
    <title>KOT — ${order.orderNumber}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Courier New', monospace; width: 80mm; padding: 8px; font-size: 12px; }
      .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 6px; }
      .header h2 { font-size: 18px; font-weight: bold; letter-spacing: 2px; }
      .info { margin-bottom: 8px; font-size: 11px; }
      .info div { display: flex; justify-content: space-between; margin: 2px 0; }
      .kot-item { padding: 6px 0; }
      .qty { font-size: 24px; font-weight: bold; margin-right: 6px; }
      .name { font-size: 18px; font-weight: bold; }
      .note { font-size: 12px; color: #333; margin-left: 32px; margin-top: 2px; }
      .divider { border-top: 1px dashed #999; margin: 2px 0; }
      .order-note { margin-top: 8px; border-top: 2px solid #000; padding-top: 6px; font-size: 12px; }
      @media print {
        button { display: none !important; }
        @page { size: 80mm auto; margin: 0; }
      }
    </style>
  </head><body>
    <div class="header">
      <h2>KOT — রান্নাঘর</h2>
      ${kotNumber ? `<div style="font-size:14px;font-weight:bold">${kotNumber}</div>` : ""}
    </div>
    <div class="info">
      <div><span>অর্ডার</span><span><b>${order.orderNumber}</b></span></div>
      <div><span>সময়</span><span>${new Date(order.createdAt).toLocaleTimeString("bn-BD")}</span></div>
      ${order.table ? `<div><span>টেবিল</span><span><b>${order.table.number} (${order.table.floor})</b></span></div>` : ""}
      ${order.waiter ? `<div><span>ওয়েটার</span><span>${order.waiter.user.name}</span></div>` : ""}
    </div>
    <div style="border-top:2px solid #000;margin-bottom:6px"></div>
    ${itemRows}
    ${order.note ? `<div class="order-note">📝 নোট: ${order.note}</div>` : ""}
    <div style="text-align:center;margin-top:12px;font-size:11px;color:#666">— KOT প্রিন্ট সম্পন্ন —</div>
    <div style="text-align:center;margin-top:8px" class="no-print">
      <button onclick="window.print()" style="padding:6px 16px;cursor:pointer">🖨️ প্রিন্ট</button>
    </div>
  </body></html>`;
}
