"use client";

import React, { useEffect, useRef } from "react";
import QRCode from "react-qr-code";

export interface SlipSettings {
  template: string;
  primaryColor: string;
  accentColor: string;
  showBarcode: boolean;
  showQR: boolean;
  showSocialMedia: boolean;
  showProductPhotos: boolean;
  hideBrandBadge: boolean;
  customMessage: string;
  facebookPage: string;
  whatsapp: string;
}

export interface SlipItem {
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: { name: string; imageUrl?: string | null };
  comboId?: string | null;
  comboItems?: { name: string; quantity: number }[];
}

export interface RelatedOrder {
  id: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  deliveryCharge: number;
  createdAt: string;
  items: SlipItem[];
}

export interface SlipOrder {
  id: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  deliveryCharge: number;
  createdAt: string;
  note?: string | null;
  customer?: { name: string; phone?: string | null; address?: string | null } | null;
  items: SlipItem[];
  relatedOrders?: RelatedOrder[];
}

export interface SlipShop {
  name: string;
  phone?: string | null;
  logoUrl?: string | null;
}

export function formatBDT(n: number) {
  return `৳${n.toLocaleString("bn-BD")}`;
}
function formatBanglaDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" });
}
export function shortId(id: string) {
  return `ORD-${id.slice(-6).toUpperCase()}`;
}

/* ── Social icon badges ── */
function FBBadge() {
  return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 15, height: 15, borderRadius: "50%", backgroundColor: "#1877F2", color: "#fff", fontSize: 9, fontWeight: 900, flexShrink: 0, lineHeight: 1, verticalAlign: "middle" }}>f</span>;
}
function WABadge() {
  return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 15, height: 15, borderRadius: "50%", backgroundColor: "#25D366", color: "#fff", fontSize: 8, fontWeight: 700, flexShrink: 0, lineHeight: 1, verticalAlign: "middle" }}>W</span>;
}

/* ── Product photo thumbnail ── */
function ProductPhoto({ url, size = 30 }: { url?: string | null; size?: number }) {
  if (!url) return null;
  return <img src={url} alt="" style={{ width: size, height: size, objectFit: "cover", borderRadius: 4, flexShrink: 0, display: "block" }} />;
}

/* ── Combo badge + component sub-list ── */
function ComboBadge() {
  return <span style={{ display: "inline-flex", alignItems: "center", fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 3, backgroundColor: "#FFF3DC", color: "#B45309", marginLeft: 5, flexShrink: 0, verticalAlign: "middle" }}>📦 কমবো</span>;
}
function ComboSubList({ items }: { items: { name: string; quantity: number }[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginTop: 3, paddingLeft: 4 }}>
      {items.map((ci, i) => (
        <div key={i} style={{ fontSize: 10, color: "#888", lineHeight: 1.5 }}>
          └ {ci.name} × {ci.quantity}
        </div>
      ))}
    </div>
  );
}

/* ── Multi-order helpers ── */
function getAllOrders(order: SlipOrder): RelatedOrder[] {
  return [order as RelatedOrder, ...(order.relatedOrders ?? [])];
}
function grandTotals(order: SlipOrder) {
  const all = getAllOrders(order);
  return {
    total:    all.reduce((s, o) => s + o.totalAmount, 0),
    paid:     all.reduce((s, o) => s + o.paidAmount, 0),
    due:      all.reduce((s, o) => s + o.dueAmount, 0),
    delivery: all.reduce((s, o) => s + o.deliveryCharge, 0),
  };
}

interface TemplateProps {
  order: SlipOrder;
  shop: SlipShop;
  settings: SlipSettings;
  barcodeRef: React.RefObject<SVGSVGElement | null>;
  qrData: string;
  primary: string;
  accent: string;
  ordId: string;
}

/* ──────────────── TEMPLATE 1: CLASSIC ──────────────── */
function ClassicTemplate({ order, shop, settings, barcodeRef, qrData, primary, accent, ordId }: TemplateProps) {
  const border = "#e8e6df";
  return (
    <div style={{ width: "560px", minHeight: "793px", backgroundColor: "#fff", fontFamily: "'Hind Siliguri','Noto Sans Bengali',Arial,sans-serif", fontSize: "13px", color: "#1a1a18" }}>
      <div style={{ backgroundColor: primary, padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
        {shop.logoUrl
          ? <img src={shop.logoUrl} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", border: "2px solid rgba(255,255,255,0.3)", flexShrink: 0 }} />
          : <div style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 20 }}>{shop.name[0]?.toUpperCase()}</span>
            </div>
        }
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>{shop.name}</div>
          {shop.phone && <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 3 }}>📞 {shop.phone}</div>}
          {settings.showSocialMedia && settings.facebookPage && (
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
              <FBBadge /> {settings.facebookPage}
            </div>
          )}
        </div>
        {settings.showSocialMedia && settings.whatsapp && (
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, textAlign: "right", flexShrink: 0, display: "flex", alignItems: "center", gap: 5 }}>
            <WABadge /> {settings.whatsapp}
          </div>
        )}
      </div>
      <div style={{ backgroundColor: `${primary}12`, padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}` }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>অর্ডার স্লিপ <span style={{ color: "#6b7280", fontWeight: 400, fontSize: 12 }}>• {formatBanglaDate(order.createdAt)}</span></span>
        <span style={{ fontWeight: 700, fontSize: 15, color: accent === "#00e676" ? primary : accent }}>{ordId}</span>
      </div>
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${border}` }}>
        <div style={{ fontWeight: 600, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 7 }}>প্রাপক</div>
        {order.customer ? (
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "3px 10px" }}>
            {order.customer.name && <><span style={{ color: "#6b7280", fontSize: 12 }}>নাম:</span><span style={{ fontWeight: 600 }}>{order.customer.name}</span></>}
            {order.customer.phone && <><span style={{ color: "#6b7280", fontSize: 12 }}>ফোন:</span><span>{order.customer.phone}</span></>}
            {order.customer.address && <><span style={{ color: "#6b7280", fontSize: 12 }}>ঠিকানা:</span><span style={{ lineHeight: 1.4 }}>{order.customer.address}</span></>}
          </div>
        ) : <span style={{ color: "#6b7280", fontSize: 12 }}>তথ্য নেই</span>}
      </div>
      <ProductsTable order={order} primary={primary} accent={accent} border={border} settings={settings} />
      <CodesSection settings={settings} barcodeRef={barcodeRef} qrData={qrData} primary={primary} border={border} />
      {settings.customMessage && <div style={{ backgroundColor: `${primary}08`, padding: "12px 20px", borderTop: `1px solid ${border}`, textAlign: "center" }}>
        <p style={{ color: primary, fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>{settings.customMessage}</p>
      </div>}
      <WatermarkFooter border={border} settings={settings} />
    </div>
  );
}

/* ──────────────── TEMPLATE 2: MODERN ──────────────── */
function ModernTemplate({ order, shop, settings, barcodeRef, qrData, primary, accent, ordId }: TemplateProps) {
  const border = "#ececec";
  const accentCol = accent === "#00e676" ? primary : accent;
  return (
    <div style={{ width: "560px", minHeight: "793px", backgroundColor: "#fff", fontFamily: "'Hind Siliguri','Noto Sans Bengali',Arial,sans-serif", fontSize: "13px", color: "#1a1a18" }}>
      <div style={{ height: 5, background: `linear-gradient(90deg, ${primary}, ${accentCol})` }} />
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, borderBottom: `1px solid ${border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
          {shop.logoUrl
            ? <img src={shop.logoUrl} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
            : <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: `${primary}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: primary, fontWeight: 700, fontSize: 18 }}>{shop.name[0]?.toUpperCase()}</span>
              </div>
          }
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: primary }}>{shop.name}</div>
            {shop.phone && <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>📞 {shop.phone}</div>}
            {settings.showSocialMedia && settings.facebookPage && (
              <div style={{ color: "#6b7280", fontSize: 12, display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                <FBBadge /> {settings.facebookPage}
              </div>
            )}
            {settings.showSocialMedia && settings.whatsapp && (
              <div style={{ color: "#6b7280", fontSize: 12, display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                <WABadge /> {settings.whatsapp}
              </div>
            )}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, borderLeft: `1px solid ${border}`, paddingLeft: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: accentCol }}>{ordId}</div>
          <div style={{ color: "#6b7280", fontSize: 11, marginTop: 3 }}>{formatBanglaDate(order.createdAt)}</div>
        </div>
      </div>
      <div style={{ margin: "14px 20px 0", borderRadius: 10, border: `1px solid ${border}`, padding: "12px 14px", backgroundColor: `${primary}06` }}>
        <div style={{ fontWeight: 600, fontSize: 11, color: primary, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>প্রাপক</div>
        {order.customer ? (
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {order.customer.name && <div><div style={{ color: "#6b7280", fontSize: 11 }}>নাম</div><div style={{ fontWeight: 600, fontSize: 13 }}>{order.customer.name}</div></div>}
            {order.customer.phone && <div><div style={{ color: "#6b7280", fontSize: 11 }}>ফোন</div><div style={{ fontSize: 13 }}>{order.customer.phone}</div></div>}
            {order.customer.address && <div style={{ flex: 1 }}><div style={{ color: "#6b7280", fontSize: 11 }}>ঠিকানা</div><div style={{ fontSize: 13, lineHeight: 1.4 }}>{order.customer.address}</div></div>}
          </div>
        ) : <span style={{ color: "#6b7280", fontSize: 12 }}>তথ্য নেই</span>}
      </div>
      <div style={{ margin: "0 20px" }}>
        <ProductsTable order={order} primary={primary} accent={accent} border={border} settings={settings} />
      </div>
      <CodesSection settings={settings} barcodeRef={barcodeRef} qrData={qrData} primary={primary} border={border} />
      {settings.customMessage && <div style={{ padding: "12px 20px", borderTop: `1px solid ${border}`, textAlign: "center" }}>
        <p style={{ color: "#555", fontSize: 13, fontWeight: 500, lineHeight: 1.5, fontStyle: "italic" }}>"{settings.customMessage}"</p>
      </div>}
      <WatermarkFooter border={border} settings={settings} />
    </div>
  );
}

/* ──────────────── TEMPLATE 3: MINIMAL ──────────────── */
function MinimalTemplate({ order, shop, settings, barcodeRef, qrData, primary, accent, ordId }: TemplateProps) {
  const border = "#e5e5e5";
  const accentCol = accent === "#00e676" ? primary : accent;
  const isMulti = (order.relatedOrders?.length ?? 0) > 0;
  const allOrds = getAllOrders(order);
  const gt = grandTotals(order);
  return (
    <div style={{ width: "560px", minHeight: "793px", backgroundColor: "#fff", fontFamily: "'Hind Siliguri','Noto Sans Bengali',Arial,sans-serif", fontSize: "13px", color: "#1a1a18", padding: "24px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 16, borderBottom: `2px solid ${primary}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {shop.logoUrl
            ? <img src={shop.logoUrl} alt="" style={{ width: 38, height: 38, borderRadius: 6, objectFit: "cover" }} />
            : <div style={{ width: 38, height: 38, borderRadius: 6, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: primary }}>{shop.name[0]?.toUpperCase()}</span>
              </div>
          }
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a18" }}>{shop.name}</div>
            {shop.phone && <div style={{ color: "#888", fontSize: 11, marginTop: 1 }}>{shop.phone}</div>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: accentCol }}>{isMulti ? `${allOrds.length}টি অর্ডার` : ordId}</div>
          <div style={{ color: "#888", fontSize: 11, marginTop: 2 }}>{formatBanglaDate(order.createdAt)}</div>
        </div>
      </div>
      {order.customer && (
        <div style={{ paddingTop: 14, paddingBottom: 14, borderBottom: `1px solid ${border}` }}>
          <div style={{ color: "#888", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>প্রাপক</div>
          <div style={{ color: "#1a1a18", fontSize: 13 }}>
            {order.customer.name && <span style={{ fontWeight: 600 }}>{order.customer.name}</span>}
            {order.customer.phone && <span style={{ color: "#555", marginLeft: 10 }}>{order.customer.phone}</span>}
            {order.customer.address && <div style={{ color: "#555", fontSize: 12, marginTop: 3, lineHeight: 1.4 }}>{order.customer.address}</div>}
          </div>
        </div>
      )}
      <div style={{ paddingTop: 14 }}>
        <div style={{ color: "#888", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>পণ্য</div>
        {isMulti ? (
          allOrds.map((ord, gi) => (
            <div key={gi} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: primary, backgroundColor: `${primary}0d`, padding: "3px 6px", borderRadius: 4, marginBottom: 4 }}>
                {shortId(ord.id)} — {formatBanglaDate(ord.createdAt)}
              </div>
              {ord.items.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "5px 0", borderBottom: `1px solid ${border}`, fontSize: 13 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 7, flex: 1 }}>
                    {settings.showProductPhotos && !item.comboId && <ProductPhoto url={item.product.imageUrl} size={26} />}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 3 }}>
                        <span>{item.product.name}</span>
                        {item.comboId && <ComboBadge />}
                        <span style={{ color: "#888", fontSize: 12 }}>× {item.quantity}</span>
                      </div>
                      {item.comboId && item.comboItems && <ComboSubList items={item.comboItems} />}
                    </div>
                  </div>
                  <span style={{ fontWeight: 600, flexShrink: 0 }}>{formatBDT(item.subtotal)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666", padding: "4px 0" }}>
                <span>উপমোট ({shortId(ord.id)}):</span><span style={{ fontWeight: 600 }}>{formatBDT(ord.totalAmount)}</span>
              </div>
            </div>
          ))
        ) : (
          order.items.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "6px 0", borderBottom: `1px solid ${border}`, fontSize: 13 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 7, flex: 1 }}>
                {settings.showProductPhotos && !item.comboId && <ProductPhoto url={item.product.imageUrl} size={26} />}
                <div>
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 3 }}>
                    <span>{item.product.name}</span>
                    {item.comboId && <ComboBadge />}
                    <span style={{ color: "#888", fontSize: 12 }}>× {item.quantity}</span>
                  </div>
                  {item.comboId && item.comboItems && <ComboSubList items={item.comboItems} />}
                </div>
              </div>
              <span style={{ fontWeight: 600, flexShrink: 0 }}>{formatBDT(item.subtotal)}</span>
            </div>
          ))
        )}
        <div style={{ marginTop: 12 }}>
          {(isMulti ? gt.delivery : order.deliveryCharge) > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666", marginBottom: 4 }}>
            <span>ডেলিভারি</span><span>{formatBDT(isMulti ? gt.delivery : order.deliveryCharge)}</span>
          </div>}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15, paddingTop: 8, borderTop: `2px solid ${primary}`, marginTop: 6 }}>
            <span>{isMulti ? "গ্র্যান্ড টোটাল" : "সর্বমোট"}</span><span style={{ color: accentCol }}>{formatBDT(isMulti ? gt.total : order.totalAmount)}</span>
          </div>
          {(isMulti ? gt.paid : order.paidAmount) > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#059669", marginTop: 4 }}>
            <span>অগ্রিম</span><span>−{formatBDT(isMulti ? gt.paid : order.paidAmount)}</span>
          </div>}
          {(isMulti ? gt.due : order.dueAmount) > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15, paddingTop: 6, borderTop: `1px solid ${border}`, marginTop: 6 }}>
            <span>বাকি (COD)</span><span style={{ color: "#DC2626" }}>{formatBDT(isMulti ? gt.due : order.dueAmount)}</span>
          </div>}
        </div>
      </div>
      <CodesSection settings={settings} barcodeRef={barcodeRef} qrData={qrData} primary={primary} border={border} />
      {settings.customMessage && <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${border}`, textAlign: "center" }}>
        <p style={{ color: "#888", fontSize: 12, lineHeight: 1.5 }}>{settings.customMessage}</p>
      </div>}
      {settings.showSocialMedia && (settings.facebookPage || settings.whatsapp) && (
        <div style={{ marginTop: 8, textAlign: "center", color: "#aaa", fontSize: 11, display: "flex", justifyContent: "center", gap: 16 }}>
          {settings.facebookPage && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><FBBadge /> {settings.facebookPage}</span>}
          {settings.whatsapp && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><WABadge /> {settings.whatsapp}</span>}
        </div>
      )}
      {!settings.hideBrandBadge && <div style={{ marginTop: 20, textAlign: "center" }}><span style={{ fontSize: 10, color: "#ccc" }}>Powered by BizilCore</span></div>}
    </div>
  );
}

/* ──────────────── TEMPLATE 4: THERMAL ──────────────── */
function ThermalTemplate({ order, shop, settings, barcodeRef, qrData, primary, accent, ordId }: TemplateProps) {
  const border = "#ccc";
  const accentCol = accent === "#00e676" ? primary : accent;
  const isMulti = (order.relatedOrders?.length ?? 0) > 0;
  const allOrds = getAllOrders(order);
  const gt = grandTotals(order);
  return (
    <div style={{ width: "560px", minHeight: "793px", backgroundColor: "#fff", fontFamily: "'Courier New', 'Lucida Console', monospace", fontSize: "13px", color: "#1a1a18", padding: "24px 32px" }}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        {shop.logoUrl && <img src={shop.logoUrl} alt="" style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover", margin: "0 auto 8px", display: "block" }} />}
        <div style={{ fontWeight: 700, fontSize: 20, color: primary, letterSpacing: 1 }}>{shop.name.toUpperCase()}</div>
        {shop.phone && <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{shop.phone}</div>}
        {settings.showSocialMedia && settings.facebookPage && (
          <div style={{ fontSize: 11, color: "#555", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 2 }}>
            <FBBadge /> {settings.facebookPage}
          </div>
        )}
        {settings.showSocialMedia && settings.whatsapp && (
          <div style={{ fontSize: 11, color: "#555", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 2 }}>
            <WABadge /> {settings.whatsapp}
          </div>
        )}
      </div>
      <Dashes />
      <div style={{ textAlign: "center", margin: "10px 0" }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{isMulti ? `${allOrds.length}টি অর্ডার` : ordId}</div>
        <div style={{ fontSize: 12, color: "#555" }}>{formatBanglaDate(order.createdAt)}</div>
      </div>
      <Dashes />
      {order.customer && (
        <>
          <div style={{ margin: "10px 0", fontSize: 13 }}>
            {order.customer.name && <div><span style={{ color: "#555" }}>নাম: </span><strong>{order.customer.name}</strong></div>}
            {order.customer.phone && <div><span style={{ color: "#555" }}>ফোন: </span>{order.customer.phone}</div>}
            {order.customer.address && <div><span style={{ color: "#555" }}>ঠিকানা: </span>{order.customer.address}</div>}
          </div>
          <Dashes />
        </>
      )}
      <div style={{ margin: "10px 0" }}>
        <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>পণ্যের বিবরণ</div>
        {isMulti ? (
          allOrds.map((ord, gi) => (
            <div key={gi} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 11, color: "#555", marginBottom: 3, borderBottom: "1px dashed #ccc", paddingBottom: 2 }}>
                ► {shortId(ord.id)}
              </div>
              {ord.items.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "4px 0", borderBottom: "1px dotted #ccc", fontSize: 13 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 6, flex: 1 }}>
                    {settings.showProductPhotos && !item.comboId && <ProductPhoto url={item.product.imageUrl} size={26} />}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 3 }}>
                        <span style={{ fontWeight: 600 }}>{item.product.name}</span>
                        {item.comboId && <ComboBadge />}
                      </div>
                      <div style={{ color: "#555", fontSize: 12 }}>{item.quantity} × {formatBDT(item.unitPrice)}</div>
                      {item.comboId && item.comboItems && <ComboSubList items={item.comboItems} />}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, flexShrink: 0 }}>{formatBDT(item.subtotal)}</div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666", padding: "3px 0" }}>
                <span>উপমোট:</span><span>{formatBDT(ord.totalAmount)}</span>
              </div>
            </div>
          ))
        ) : (
          order.items.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "4px 0", borderBottom: "1px dotted #ccc", fontSize: 13 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6, flex: 1 }}>
                {settings.showProductPhotos && !item.comboId && <ProductPhoto url={item.product.imageUrl} size={26} />}
                <div>
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 3 }}>
                    <span style={{ fontWeight: 600 }}>{item.product.name}</span>
                    {item.comboId && <ComboBadge />}
                  </div>
                  <div style={{ color: "#555", fontSize: 12 }}>{item.quantity} × {formatBDT(item.unitPrice)}</div>
                  {item.comboId && item.comboItems && <ComboSubList items={item.comboItems} />}
                </div>
              </div>
              <div style={{ fontWeight: 700, flexShrink: 0 }}>{formatBDT(item.subtotal)}</div>
            </div>
          ))
        )}
      </div>
      <Dashes />
      <div style={{ margin: "10px 0", fontSize: 13 }}>
        {(isMulti ? gt.delivery : order.deliveryCharge) > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>ডেলিভারি:</span><span>{formatBDT(isMulti ? gt.delivery : order.deliveryCharge)}</span></div>}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, marginTop: 6 }}><span>{isMulti ? "গ্র্যান্ড টোটাল:" : "মোট:"}</span><span style={{ color: accentCol }}>{formatBDT(isMulti ? gt.total : order.totalAmount)}</span></div>
        {(isMulti ? gt.paid : order.paidAmount) > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: "#059669" }}><span>অগ্রিম:</span><span>{formatBDT(isMulti ? gt.paid : order.paidAmount)}</span></div>}
        {(isMulti ? gt.due : order.dueAmount) > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 18, marginTop: 8, padding: "8px 0", borderTop: "2px solid #000", borderBottom: "2px solid #000" }}>
            <span>COD বাকি:</span><span style={{ color: "#DC2626" }}>{formatBDT(isMulti ? gt.due : order.dueAmount)}</span>
          </div>
        )}
      </div>
      <Dashes />
      {(settings.showQR || settings.showBarcode) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, margin: "12px 0" }}>
          {settings.showQR && <div style={{ textAlign: "center" }}>
            <QRCode value={qrData} size={70} fgColor={primary} bgColor="transparent" />
            <div style={{ fontSize: 10, color: "#555", marginTop: 3 }}>Scan</div>
          </div>}
          {settings.showBarcode && <svg ref={barcodeRef} style={{ maxWidth: "220px" }} />}
        </div>
      )}
      {settings.customMessage && (
        <>
          <Dashes />
          <div style={{ textAlign: "center", margin: "10px 0", fontSize: 13, lineHeight: 1.6 }}>🙏 {settings.customMessage}</div>
        </>
      )}
      <Dashes />
      {!settings.hideBrandBadge && <div style={{ textAlign: "center", fontSize: 10, color: "#aaa", marginTop: 8 }}>Powered by BizilCore</div>}
    </div>
  );
}

/* ──────────────── TEMPLATE 5: BOLD ──────────────── */
function BoldTemplate({ order, shop, settings, barcodeRef, qrData, primary, accent, ordId }: TemplateProps) {
  const border = "#e8e8e8";
  const accentCol = accent === "#00e676" ? primary : accent;
  const isMulti = (order.relatedOrders?.length ?? 0) > 0;
  const allOrds = getAllOrders(order);
  const gt = grandTotals(order);
  return (
    <div style={{ width: "560px", minHeight: "793px", backgroundColor: "#fff", fontFamily: "'Hind Siliguri','Noto Sans Bengali',Arial,sans-serif", fontSize: "13px", color: "#1a1a18" }}>
      <div style={{ backgroundColor: primary, padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          {shop.logoUrl
            ? <img src={shop.logoUrl} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", border: "2px solid rgba(255,255,255,0.3)", flexShrink: 0 }} />
            : <div style={{ width: 52, height: 52, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 22 }}>{shop.name[0]?.toUpperCase()}</span>
              </div>
          }
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 18, letterSpacing: "0.3px" }}>{shop.name}</div>
            {shop.phone && <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 3 }}>📞 {shop.phone}</div>}
            {settings.showSocialMedia && settings.facebookPage && (
              <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
                <FBBadge /> {settings.facebookPage}
              </div>
            )}
            {settings.showSocialMedia && settings.whatsapp && (
              <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 1, display: "flex", alignItems: "center", gap: 5 }}>
                <WABadge /> {settings.whatsapp}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 8, padding: "6px 14px", display: "inline-flex", alignItems: "center" }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>{isMulti ? `${allOrds.length}টি অর্ডার` : ordId}</span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }}>{formatBanglaDate(order.createdAt)}</span>
        </div>
      </div>
      {order.customer && (
        <div style={{ padding: "14px 24px", backgroundColor: `${primary}0a`, borderBottom: `1px solid ${border}` }}>
          <div style={{ fontWeight: 600, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 7 }}>প্রাপক</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px" }}>
            {order.customer.name && <div><span style={{ fontWeight: 700, fontSize: 14 }}>{order.customer.name}</span></div>}
            {order.customer.phone && <div style={{ fontSize: 13, color: "#444" }}>{order.customer.phone}</div>}
            {order.customer.address && <div style={{ fontSize: 13, color: "#555", lineHeight: 1.4, width: "100%" }}>{order.customer.address}</div>}
          </div>
        </div>
      )}
      <div style={{ padding: "0 24px" }}>
        <div style={{ marginTop: 14, marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>পণ্যের বিবরণ</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ padding: "8px 0", textAlign: "left", fontWeight: 700, color: primary, borderBottom: `2px solid ${primary}`, fontSize: 12 }}>পণ্য</th>
                <th style={{ padding: "8px 0", textAlign: "center", fontWeight: 700, color: primary, borderBottom: `2px solid ${primary}`, fontSize: 12, width: 40 }}>পরি.</th>
                <th style={{ padding: "8px 0", textAlign: "right", fontWeight: 700, color: primary, borderBottom: `2px solid ${primary}`, fontSize: 12, width: 75 }}>মূল্য</th>
                <th style={{ padding: "8px 0", textAlign: "right", fontWeight: 700, color: primary, borderBottom: `2px solid ${primary}`, fontSize: 12, width: 85 }}>মোট</th>
              </tr>
            </thead>
            <tbody>
              {isMulti ? (
                allOrds.map((ord, gi) => (
                  <React.Fragment key={gi}>
                    <tr>
                      <td colSpan={4} style={{ padding: "5px 0", backgroundColor: `${primary}0d`, fontSize: 11, fontWeight: 600, color: primary, paddingLeft: 4 }}>
                        ▸ {shortId(ord.id)} — {formatBanglaDate(ord.createdAt)}
                      </td>
                    </tr>
                    {ord.items.map((item, i) => (
                      <tr key={`bold-item-${gi}-${i}`} style={{ backgroundColor: i % 2 === 1 ? "#f8f8f8" : "transparent" }}>
                        <td style={{ padding: "8px 0" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                            {settings.showProductPhotos && !item.comboId && <ProductPhoto url={item.product.imageUrl} size={28} />}
                            <div>
                              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 3 }}>
                                <span>{item.product.name}</span>
                                {item.comboId && <ComboBadge />}
                              </div>
                              {item.comboId && item.comboItems && <ComboSubList items={item.comboItems} />}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "8px 0", textAlign: "center" }}>{item.quantity}</td>
                        <td style={{ padding: "8px 0", textAlign: "right" }}>{formatBDT(item.unitPrice)}</td>
                        <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 600 }}>{formatBDT(item.subtotal)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={3} style={{ padding: "4px 0", textAlign: "right", fontSize: 11, color: "#666" }}>উপমোট:</td>
                      <td style={{ padding: "4px 0", textAlign: "right", fontWeight: 600, fontSize: 12, borderTop: `1px solid ${border}` }}>{formatBDT(ord.totalAmount)}</td>
                    </tr>
                  </React.Fragment>
                ))
              ) : (
                order.items.map((item, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 1 ? "#f8f8f8" : "transparent" }}>
                    <td style={{ padding: "8px 0" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                        {settings.showProductPhotos && !item.comboId && <ProductPhoto url={item.product.imageUrl} size={28} />}
                        <div>
                          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 3 }}>
                            <span>{item.product.name}</span>
                            {item.comboId && <ComboBadge />}
                          </div>
                          {item.comboId && item.comboItems && <ComboSubList items={item.comboItems} />}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "8px 0", textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ padding: "8px 0", textAlign: "right" }}>{formatBDT(item.unitPrice)}</td>
                    <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 600 }}>{formatBDT(item.subtotal)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${border}` }}>
            {(isMulti ? gt.delivery : order.deliveryCharge) > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666", marginBottom: 4 }}>
              <span>ডেলিভারি চার্জ:</span><span>{formatBDT(isMulti ? gt.delivery : order.deliveryCharge)}</span>
            </div>}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15 }}>
              <span>{isMulti ? "গ্র্যান্ড টোটাল:" : "সর্বমোট:"}</span><span>{formatBDT(isMulti ? gt.total : order.totalAmount)}</span>
            </div>
            {(isMulti ? gt.paid : order.paidAmount) > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#059669", marginTop: 4 }}>
              <span>অগ্রিম:</span><span>{formatBDT(isMulti ? gt.paid : order.paidAmount)}</span>
            </div>}
          </div>
        </div>
      </div>
      {(isMulti ? gt.due : order.dueAmount) > 0 && (
        <div style={{ margin: "0 24px 14px", borderRadius: 12, backgroundColor: primary, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginBottom: 2 }}>সংগ্রহ করুন (COD)</div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 26 }}>{formatBDT(isMulti ? gt.due : order.dueAmount)}</div>
          </div>
          <div style={{ fontSize: 32, opacity: 0.35 }}>💰</div>
        </div>
      )}
      <CodesSection settings={settings} barcodeRef={barcodeRef} qrData={qrData} primary={primary} border={border} />
      {settings.customMessage && <div style={{ padding: "10px 24px", textAlign: "center", borderTop: `1px solid ${border}` }}>
        <p style={{ color: "#555", fontSize: 13, lineHeight: 1.5 }}>{settings.customMessage}</p>
      </div>}
      <WatermarkFooter border={border} settings={settings} />
    </div>
  );
}

/* ──────────────── TEMPLATE 6: ELEGANT ──────────────── */
function ElegantTemplate({ order, shop, settings, barcodeRef, qrData, primary, accent, ordId }: TemplateProps) {
  const border = "#e8e8e8";
  const accentCol = accent === "#00e676" ? primary : accent;
  const isMulti = (order.relatedOrders?.length ?? 0) > 0;
  const allOrds = getAllOrders(order);
  const gt = grandTotals(order);
  return (
    <div style={{ width: "560px", minHeight: "793px", backgroundColor: "#fff", fontFamily: "'Hind Siliguri','Noto Sans Bengali',Arial,sans-serif", fontSize: "13px", color: "#1a1a18", display: "flex" }}>
      <div style={{ width: 5, backgroundColor: primary, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: "22px 22px 16px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 14, borderBottom: `1px solid ${border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {shop.logoUrl
              ? <img src={shop.logoUrl} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              : <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: `${primary}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: primary, fontWeight: 700, fontSize: 18 }}>{shop.name[0]?.toUpperCase()}</span>
                </div>
            }
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#111", letterSpacing: "0.2px" }}>{shop.name}</div>
              {shop.phone && <div style={{ color: "#888", fontSize: 12, marginTop: 2 }}>{shop.phone}</div>}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Order</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: accentCol }}>{isMulti ? "একাধিক" : ordId}</div>
            <div style={{ color: "#aaa", fontSize: 11, marginTop: 3 }}>{formatBanglaDate(order.createdAt)}</div>
          </div>
        </div>
        {order.customer && (
          <div style={{ padding: "12px 0", borderBottom: `1px solid ${border}` }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
              <div style={{ width: 3, height: "100%", minHeight: 16, backgroundColor: primary, borderRadius: 2, flexShrink: 0 }} />
              <span style={{ fontWeight: 600, fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px" }}>প্রাপক</span>
            </div>
            {order.customer.name && <div style={{ fontWeight: 600, fontSize: 14, color: "#111", marginBottom: 2 }}>{order.customer.name}</div>}
            {order.customer.phone && <div style={{ color: "#666", fontSize: 13 }}>{order.customer.phone}</div>}
            {order.customer.address && <div style={{ color: "#666", fontSize: 13, lineHeight: 1.5, marginTop: 2 }}>{order.customer.address}</div>}
          </div>
        )}
        {settings.showSocialMedia && (settings.facebookPage || settings.whatsapp) && (
          <div style={{ padding: "8px 0", borderBottom: `1px solid ${border}`, display: "flex", gap: 16, fontSize: 12, color: "#888" }}>
            {settings.facebookPage && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><FBBadge /> {settings.facebookPage}</span>}
            {settings.whatsapp && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><WABadge /> {settings.whatsapp}</span>}
          </div>
        )}
        <div style={{ padding: "12px 0 0" }}>
          <div style={{ fontWeight: 600, fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>পণ্য</div>
          {isMulti ? (
            allOrds.map((ord, gi) => (
              <div key={gi} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: primary, marginBottom: 4, padding: "2px 6px", backgroundColor: `${primary}0d`, borderRadius: 4 }}>
                  {shortId(ord.id)} — {formatBanglaDate(ord.createdAt)}
                </div>
                {ord.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "7px 0", borderBottom: `1px solid ${border}`, fontSize: 13 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 7, flex: 1 }}>
                      {settings.showProductPhotos && !item.comboId && <ProductPhoto url={item.product.imageUrl} size={28} />}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 3 }}>
                          <span style={{ fontWeight: 500 }}>{item.product.name}</span>
                          {item.comboId && <ComboBadge />}
                          <span style={{ color: "#aaa", fontSize: 12 }}>× {item.quantity} @ {formatBDT(item.unitPrice)}</span>
                        </div>
                        {item.comboId && item.comboItems && <ComboSubList items={item.comboItems} />}
                      </div>
                    </div>
                    <span style={{ fontWeight: 600, flexShrink: 0 }}>{formatBDT(item.subtotal)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888", padding: "4px 0" }}>
                  <span>উপমোট ({shortId(ord.id)}):</span><span style={{ fontWeight: 600 }}>{formatBDT(ord.totalAmount)}</span>
                </div>
              </div>
            ))
          ) : (
            order.items.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "7px 0", borderBottom: `1px solid ${border}`, fontSize: 13 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 7, flex: 1 }}>
                  {settings.showProductPhotos && !item.comboId && <ProductPhoto url={item.product.imageUrl} size={28} />}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 3 }}>
                      <span style={{ fontWeight: 500 }}>{item.product.name}</span>
                      {item.comboId && <ComboBadge />}
                      <span style={{ color: "#aaa", fontSize: 12 }}>× {item.quantity} @ {formatBDT(item.unitPrice)}</span>
                    </div>
                    {item.comboId && item.comboItems && <ComboSubList items={item.comboItems} />}
                  </div>
                </div>
                <span style={{ fontWeight: 600, flexShrink: 0 }}>{formatBDT(item.subtotal)}</span>
              </div>
            ))
          )}
          <div style={{ marginTop: 10 }}>
            {(isMulti ? gt.delivery : order.deliveryCharge) > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888", marginBottom: 3 }}>
              <span>ডেলিভারি</span><span>{formatBDT(isMulti ? gt.delivery : order.deliveryCharge)}</span>
            </div>}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, paddingTop: 8, borderTop: `1px solid ${border}` }}>
              <span>{isMulti ? "গ্র্যান্ড টোটাল" : "সর্বমোট"}</span><span style={{ color: accentCol }}>{formatBDT(isMulti ? gt.total : order.totalAmount)}</span>
            </div>
            {(isMulti ? gt.paid : order.paidAmount) > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#059669", marginTop: 4 }}>
              <span>অগ্রিম</span><span>−{formatBDT(isMulti ? gt.paid : order.paidAmount)}</span>
            </div>}
            {(isMulti ? gt.due : order.dueAmount) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15, marginTop: 10, padding: "10px 14px", backgroundColor: `${primary}0e`, borderRadius: 8, border: `1px solid ${primary}25` }}>
                <span>বাকি (COD)</span>
                <span style={{ color: primary, fontSize: 17 }}>{formatBDT(isMulti ? gt.due : order.dueAmount)}</span>
              </div>
            )}
          </div>
        </div>
        <CodesSection settings={settings} barcodeRef={barcodeRef} qrData={qrData} primary={primary} border={border} />
        {settings.customMessage && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${border}`, textAlign: "center" }}>
            <p style={{ color: "#888", fontSize: 12, lineHeight: 1.5, fontStyle: "italic" }}>{settings.customMessage}</p>
          </div>
        )}
        {!settings.hideBrandBadge && (
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <span style={{ fontSize: 10, color: "#ddd" }}>Powered by BizilCore</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Shared sub-components ── */
function Dashes() {
  return <div style={{ borderTop: "1px dashed #bbb", margin: "6px 0" }} />;
}
function WatermarkFooter({ border, settings }: { border: string; settings: SlipSettings }) {
  if (settings.hideBrandBadge) return null;
  return (
    <div style={{ borderTop: `1px solid ${border}`, padding: "8px 20px", textAlign: "center" }}>
      <span style={{ fontSize: 10, color: "#c0bdb8" }}>Powered by BizilCore</span>
    </div>
  );
}

function ProductsTable({ order, primary, accent, border, settings }: { order: SlipOrder; primary: string; accent: string; border: string; settings: SlipSettings }) {
  const accentCol = accent === "#00e676" ? primary : accent;
  const isMulti = (order.relatedOrders?.length ?? 0) > 0;
  const allOrds = getAllOrders(order);
  const gt = grandTotals(order);
  const showPhoto = settings.showProductPhotos;
  return (
    <div style={{ padding: "12px 0", borderBottom: `1px solid ${border}` }}>
      <div style={{ fontWeight: 600, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>পণ্যের বিবরণ</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ backgroundColor: `${primary}15` }}>
            <th style={{ padding: "7px 8px", textAlign: "left", fontWeight: 600, color: primary, borderBottom: `1px solid ${primary}30` }}>পণ্য</th>
            <th style={{ padding: "7px 8px", textAlign: "center", fontWeight: 600, color: primary, borderBottom: `1px solid ${primary}30`, width: 40 }}>পরি.</th>
            <th style={{ padding: "7px 8px", textAlign: "right", fontWeight: 600, color: primary, borderBottom: `1px solid ${primary}30`, width: 70 }}>মূল্য</th>
            <th style={{ padding: "7px 8px", textAlign: "right", fontWeight: 600, color: primary, borderBottom: `1px solid ${primary}30`, width: 80 }}>মোট</th>
          </tr>
        </thead>
        <tbody>
          {isMulti ? (
            allOrds.map((ord, gi) => (
              <React.Fragment key={gi}>
                <tr>
                  <td colSpan={4} style={{ padding: "4px 8px", backgroundColor: `${primary}0d`, fontSize: 11, fontWeight: 600, color: primary }}>
                    ▸ {shortId(ord.id)} — {formatBanglaDate(ord.createdAt)}
                  </td>
                </tr>
                {ord.items.map((item, i) => (
                  <tr key={`item-${gi}-${i}`} style={{ borderBottom: `1px solid ${border}` }}>
                    <td style={{ padding: "7px 8px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                        {showPhoto && !item.comboId && <ProductPhoto url={item.product.imageUrl} size={28} />}
                        <div>
                          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                            <span>{item.product.name}</span>
                            {item.comboId && <ComboBadge />}
                          </div>
                          {item.comboId && item.comboItems && <ComboSubList items={item.comboItems} />}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "7px 8px", textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ padding: "7px 8px", textAlign: "right" }}>{formatBDT(item.unitPrice)}</td>
                    <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 600 }}>{formatBDT(item.subtotal)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} style={{ padding: "4px 8px", textAlign: "right", fontSize: 11, color: "#666" }}>উপমোট:</td>
                  <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: 600, borderTop: `1px solid ${border}` }}>{formatBDT(ord.totalAmount)}</td>
                </tr>
              </React.Fragment>
            ))
          ) : (
            order.items.map((item, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${border}` }}>
                <td style={{ padding: "7px 8px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                    {showPhoto && !item.comboId && <ProductPhoto url={item.product.imageUrl} size={28} />}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                        <span>{item.product.name}</span>
                        {item.comboId && <ComboBadge />}
                      </div>
                      {item.comboId && item.comboItems && <ComboSubList items={item.comboItems} />}
                    </div>
                  </div>
                </td>
                <td style={{ padding: "7px 8px", textAlign: "center" }}>{item.quantity}</td>
                <td style={{ padding: "7px 8px", textAlign: "right" }}>{formatBDT(item.unitPrice)}</td>
                <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 600 }}>{formatBDT(item.subtotal)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div style={{ marginTop: 10, borderTop: `2px solid ${primary}20`, paddingTop: 10 }}>
        {(isMulti ? gt.delivery : order.deliveryCharge) > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
          <span style={{ color: "#6b7280" }}>ডেলিভারি চার্জ:</span><span>{formatBDT(isMulti ? gt.delivery : order.deliveryCharge)}</span>
        </div>}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 14 }}>
          <span>{isMulti ? "গ্র্যান্ড টোটাল:" : "সর্বমোট:"}</span><span style={{ color: accentCol, fontSize: 16 }}>{formatBDT(isMulti ? gt.total : order.totalAmount)}</span>
        </div>
        {(isMulti ? gt.paid : order.paidAmount) > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#059669", marginTop: 4 }}>
          <span>অগ্রিম পরিশোধ:</span><span>{formatBDT(isMulti ? gt.paid : order.paidAmount)}</span>
        </div>}
        {(isMulti ? gt.due : order.dueAmount) > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 14, paddingTop: 6, borderTop: `1px solid ${border}`, marginTop: 6 }}>
          <span>বাকি (COD):</span><span style={{ color: "#DC2626", fontSize: 16 }}>{formatBDT(isMulti ? gt.due : order.dueAmount)}</span>
        </div>}
      </div>
    </div>
  );
}

function CodesSection({ settings, barcodeRef, qrData, primary, border }: {
  settings: SlipSettings; barcodeRef: React.RefObject<SVGSVGElement | null>; qrData: string; primary: string; border: string;
}) {
  if (!settings.showQR && !settings.showBarcode) return null;
  return (
    <div style={{ borderTop: `1px solid ${border}`, padding: "12px 20px", display: "flex", alignItems: "center", gap: 20 }}>
      {settings.showQR && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <QRCode value={qrData} size={80} fgColor={primary} bgColor="transparent" />
          <span style={{ fontSize: 10, color: "#6b7280" }}>Scan for details</span>
        </div>
      )}
      {settings.showBarcode && <svg ref={barcodeRef} style={{ flex: 1, maxWidth: 300 }} />}
    </div>
  );
}

/* ──────────────── MAIN COMPONENT ──────────────── */
interface Props {
  order: SlipOrder;
  shop: SlipShop;
  settings: SlipSettings;
}

export default function OrderSlip({ order, shop, settings }: Props) {
  const barcodeRef = useRef<SVGSVGElement | null>(null);
  const ordId = shortId(order.id);
  const primary = settings.primaryColor || "#0d2d1a";
  const accent = settings.accentColor || "#00e676";

  useEffect(() => {
    if (!settings.showBarcode) return;
    const timer = setTimeout(() => {
      if (!barcodeRef.current) return;
      import("jsbarcode").then(({ default: JsBarcode }) => {
        if (barcodeRef.current) {
          try {
            JsBarcode(barcodeRef.current, ordId, {
              format: "CODE128", width: 2, height: 50, displayValue: true,
              fontSize: 12, margin: 4, background: "transparent", lineColor: primary,
            });
          } catch {}
        }
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [settings.showBarcode, settings.template, ordId, primary]);

  const qrData = JSON.stringify({
    order: ordId, shop: shop.name,
    customer: order.customer?.name ?? "",
    phone: order.customer?.phone ?? "",
    total: order.totalAmount, cod: order.dueAmount,
    date: new Date(order.createdAt).toISOString().split("T")[0],
  });

  const tProps: TemplateProps = { order, shop, settings, barcodeRef, qrData, primary, accent, ordId };

  switch (settings.template) {
    case "modern":   return <ModernTemplate   {...tProps} />;
    case "minimal":  return <MinimalTemplate  {...tProps} />;
    case "thermal":  return <ThermalTemplate  {...tProps} />;
    case "bold":     return <BoldTemplate     {...tProps} />;
    case "elegant":  return <ElegantTemplate  {...tProps} />;
    default:         return <ClassicTemplate  {...tProps} />;
  }
}
