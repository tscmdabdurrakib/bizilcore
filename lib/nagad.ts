import crypto from "crypto";

const NAGAD_BASE_URL = process.env.NAGAD_BASE_URL ?? "https://sandbox.mynagad.com:10080/remote-payment-gateway-1.0";
const MERCHANT_ID = process.env.NAGAD_MERCHANT_ID ?? "";
const MERCHANT_PRIVATE_KEY = process.env.NAGAD_MERCHANT_PRIVATE_KEY ?? "";
const NAGAD_PUBLIC_KEY = process.env.NAGAD_PUBLIC_KEY ?? "";

function encryptWithPublicKey(data: string): string {
  if (!NAGAD_PUBLIC_KEY) return Buffer.from(data).toString("base64");
  try {
    const pem = `-----BEGIN PUBLIC KEY-----\n${NAGAD_PUBLIC_KEY}\n-----END PUBLIC KEY-----`;
    return crypto.publicEncrypt({ key: pem, padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(data)).toString("base64");
  } catch {
    return Buffer.from(data).toString("base64");
  }
}

function signWithPrivateKey(data: string): string {
  if (!MERCHANT_PRIVATE_KEY) return Buffer.from(data).toString("base64");
  try {
    const pem = `-----BEGIN RSA PRIVATE KEY-----\n${MERCHANT_PRIVATE_KEY}\n-----END RSA PRIVATE KEY-----`;
    const sign = crypto.createSign("SHA256");
    sign.update(data);
    return sign.sign(pem, "base64");
  } catch {
    return Buffer.from(data).toString("base64");
  }
}

export async function createNagadPayment(amount: number, orderId: string, callbackURL: string) {
  const datetime = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const sensitiveData = { merchantId: MERCHANT_ID, datetime, orderId, challenge: crypto.randomBytes(16).toString("hex") };
  const sensitiveDataEncrypted = encryptWithPublicKey(JSON.stringify(sensitiveData));
  const signature = signWithPrivateKey(JSON.stringify(sensitiveData));

  const initRes = await fetch(`${NAGAD_BASE_URL}/api/dfs/check-out/initialize/${MERCHANT_ID}/${orderId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-KM-IP-V4": "127.0.0.1", "X-KM-MC-Id": MERCHANT_ID, "X-KM-Client-Type": "PC", "X-KM-Api-Version": "v-0.2.0" },
    body: JSON.stringify({ dateTime: datetime, sensitiveData: sensitiveDataEncrypted, signature }),
  });

  if (!initRes.ok) throw new Error("Nagad init failed");
  const initData = await initRes.json();

  const paymentRefId = initData.paymentReferenceId;
  const checkoutData = { amount: amount.toFixed(2), productionType: "SOFTWARE", additionalMerchantInfo: { callbackURL } };
  const checkoutSensitive = encryptWithPublicKey(JSON.stringify(checkoutData));
  const checkoutSig = signWithPrivateKey(JSON.stringify(checkoutData));

  const completeRes = await fetch(`${NAGAD_BASE_URL}/api/dfs/check-out/complete/${paymentRefId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-KM-IP-V4": "127.0.0.1", "X-KM-MC-Id": MERCHANT_ID, "X-KM-Client-Type": "PC", "X-KM-Api-Version": "v-0.2.0" },
    body: JSON.stringify({ sensitiveData: checkoutSensitive, signature: checkoutSig, merchantCallbackURL: callbackURL }),
  });

  if (!completeRes.ok) throw new Error("Nagad complete failed");
  const completeData = await completeRes.json();
  return { callURL: completeData.callBackUrl, paymentRefId };
}

export async function verifyNagadPayment(paymentRefId: string) {
  const res = await fetch(`${NAGAD_BASE_URL}/api/dfs/verify/payment/${paymentRefId}`, {
    headers: { "X-KM-MC-Id": MERCHANT_ID, "X-KM-Client-Type": "PC", "X-KM-Api-Version": "v-0.2.0" },
  });
  if (!res.ok) throw new Error("Nagad verify failed");
  return res.json();
}
