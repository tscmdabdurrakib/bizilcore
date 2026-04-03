"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginAction(email: string, password: string) {
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    // Check for disabled account (thrown from authorize)
    const msg = error instanceof Error ? error.message : "";
    if (msg.startsWith("account_disabled:")) {
      const reason = msg.replace("account_disabled:", "").trim();
      return {
        success: false,
        error: reason
          ? `আপনার অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে। কারণ: ${reason}`
          : "আপনার অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে। বিস্তারিত জানতে support@bizilcore.com-এ ইমেইল করুন।",
        disabled: true,
      };
    }
    if (error instanceof AuthError) {
      return { success: false, error: "ইমেইল বা পাসওয়ার্ড সঠিক নয়।" };
    }
    return { success: false, error: "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।" };
  }
}
