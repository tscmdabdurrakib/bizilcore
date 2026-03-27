import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const PROTECTED_PATHS = [
  "/dashboard",
  "/onboarding",
  "/inventory",
  "/orders",
  "/customers",
  "/hisab",
  "/reports",
  "/settings",
  "/tasks",
  "/hr",
  "/activity-log",
  "/billing",
  "/cod",
  "/delivery",
  "/communications",
  "/expenses",
  "/invoices",
  "/purchase-orders",
  "/returns",
  "/support",
  "/shops",
  "/suppliers",
];

const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;
  const path = nextUrl.pathname;

  const isProtected = PROTECTED_PATHS.some(p => path === p || path.startsWith(p + "/"));
  const isAuthPage = AUTH_PATHS.some(p => path === p || path.startsWith(p + "/"));

  if (!isLoggedIn && isProtected) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn && (isAuthPage || path === "/" || path.startsWith("/pricing") || path.startsWith("/about") || path.startsWith("/features") || path.startsWith("/blog") || path.startsWith("/careers") || path.startsWith("/privacy") || path.startsWith("/terms") || path.startsWith("/contact") || path.startsWith("/help") || path.startsWith("/refund"))) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|catalog|invoice|checkout|slip|invite|payment|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?|ttf|eot)).*)",
  ],
};
