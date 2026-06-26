import type { OrderStatusTemplate } from "@/lib/store/shop-easy-config";

export const DEFAULT_ORDER_STATUS_TEMPLATES: OrderStatusTemplate[] = [
  {
    id: "processing",
    label: "Processing",
    statusKey: "processing",
    message: "আপনার অর্ডার #{orderNumber} প্রসেসিং এ আছে। ধন্যবাদ! - {shopName}",
  },
  {
    id: "shipped",
    label: "Shipped",
    statusKey: "shipped",
    message: "আপনার অর্ডার #{orderNumber} পাঠানো হয়েছে! ট্র্যাক করুন: {trackUrl} - {shopName}",
  },
  {
    id: "out_for_delivery",
    label: "Out for delivery",
    statusKey: "out_for_delivery",
    message: "আপনার অর্ডার #{orderNumber} ডেলিভারির পথে! প্রস্তুত থাকুন। - {shopName}",
  },
  {
    id: "delivered",
    label: "Delivered",
    statusKey: "delivered",
    message: "আপনার অর্ডার #{orderNumber} ডেলিভারি হয়েছে। কেনাকাটার জন্য ধন্যবাদ! - {shopName}",
  },
];

export function renderOrderTemplate(
  template: string,
  vars: { orderNumber: string; customerName: string; shopName: string; trackUrl: string },
): string {
  return template
    .replace(/\{orderNumber\}/g, vars.orderNumber)
    .replace(/\{customerName\}/g, vars.customerName)
    .replace(/\{shopName\}/g, vars.shopName)
    .replace(/\{trackUrl\}/g, vars.trackUrl);
}
