export type SmsType = "masking" | "non_masking";

export const SMS_TYPES: SmsType[] = ["masking", "non_masking"];

export function parseSmsType(value: unknown): SmsType {
  return value === "masking" ? "masking" : "non_masking";
}

export function smsTypeLabel(type: SmsType): string {
  return type === "masking" ? "Masking" : "Non-Masking";
}

export function smsTypeLabelBn(type: SmsType): string {
  return type === "masking" ? "মাস্কিং" : "নন-মাস্কিং";
}

export function validateSenderId(raw: string): string | null {
  const id = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (id.length < 3 || id.length > 11) return null;
  return id;
}
