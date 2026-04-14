import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "bizilcore-store-secret-key-2024"
);

const COOKIE_NAME = "store_customer";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface StoreCustomerToken {
  id: string;
  shopId: string;
  name: string;
  email: string;
  avatar: string | null;
}

export async function signCustomerToken(payload: StoreCustomerToken): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .setIssuedAt()
    .sign(SECRET);
}

export async function verifyCustomerToken(token: string): Promise<StoreCustomerToken | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as StoreCustomerToken;
  } catch {
    return null;
  }
}

export async function getStoreCustomer(): Promise<StoreCustomerToken | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyCustomerToken(token);
  } catch {
    return null;
  }
}

export function setCustomerCookie(token: string): { name: string; value: string; options: object } {
  return {
    name: COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    },
  };
}

export function clearCustomerCookie(): { name: string; value: string; options: object } {
  return {
    name: COOKIE_NAME,
    value: "",
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    },
  };
}
