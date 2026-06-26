const SSLCOMMERZ_SANDBOX = "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";
const SSLCOMMERZ_LIVE = "https://securepay.sslcommerz.com/gwprocess/v4/api.php";

export interface SSLCommerzSessionParams {
  storeId: string;
  storePass: string;
  amount: number;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  sandbox?: boolean;
}

export async function createSSLCommerzSession(params: SSLCommerzSessionParams) {
  const base = params.sandbox ? SSLCOMMERZ_SANDBOX : SSLCOMMERZ_LIVE;
  const body = new URLSearchParams({
    store_id: params.storeId,
    store_passwd: params.storePass,
    total_amount: String(params.amount),
    currency: "BDT",
    tran_id: params.orderId,
    success_url: params.successUrl,
    fail_url: params.failUrl,
    cancel_url: params.cancelUrl,
    cus_name: params.customerName,
    cus_phone: params.customerPhone,
    cus_email: params.customerEmail || "customer@bizilcore.com",
    cus_add1: params.customerAddress,
    product_name: "Store Order",
    product_category: "General",
    product_profile: "general",
    shipping_method: "NO",
  });

  const res = await fetch(base, { method: "POST", body });
  const data = await res.json();
  if (data.status === "SUCCESS" && data.GatewayPageURL) {
    return { success: true as const, gatewayUrl: data.GatewayPageURL as string, sessionKey: data.sessionkey as string };
  }
  return { success: false as const, error: data.failedreason || "SSLCommerz session failed" };
}
