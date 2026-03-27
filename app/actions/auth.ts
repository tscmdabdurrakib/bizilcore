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
    if (error instanceof AuthError) {
      return { success: false, error: "ইমেইল বা পাসওয়ার্ড সঠিক নয়।" };
    }
    return { success: false, error: "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।" };
  }
}
