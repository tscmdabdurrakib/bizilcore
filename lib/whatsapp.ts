import crypto from "crypto";

const GRAPH_API = "https://graph.facebook.com/v18.0";

function getEncryptionKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "bizilcore-wa-fallback-key-32chars!";
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptToken(plain: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decryptToken(encrypted: string): string {
  try {
    const [ivHex, encHex] = encrypted.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const enc = Buffer.from(encHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", getEncryptionKey(), iv);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}

export function maskToken(token: string): string {
  if (token.length <= 6) return "••••••";
  return "••••••••" + token.slice(-6);
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return "88" + digits;
  return digits;
}

export async function verifyWhatsAppCredentials(
  apiToken: string,
  phoneNumberId: string
): Promise<boolean> {
  try {
    const res = await fetch(`${GRAPH_API}/${phoneNumberId}`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendWhatsAppMessage(
  apiToken: string,
  phoneNumberId: string,
  toPhone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const res = await fetch(`${GRAPH_API}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: formatPhone(toPhone),
        type: "text",
        text: { body: message },
      }),
    });
    const data = await res.json();
    if (data.error) return { success: false, error: data.error.message };
    const msgId = data.messages?.[0]?.id;
    return { success: true, messageId: msgId };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
