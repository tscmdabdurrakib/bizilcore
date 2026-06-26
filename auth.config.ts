import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  basePath: "/api/auth",
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized() {
      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.onboarded = (user as { onboarded?: boolean }).onboarded ?? false;
      }
      if (trigger === "update" && session) {
        const s = session as {
          onboarded?: boolean;
          activeShopId?: string | null;
          impersonatingUserId?: string;
          impersonatingUserName?: string;
          endImpersonation?: boolean;
        };
        if (s.onboarded !== undefined) token.onboarded = s.onboarded;
        if (s.activeShopId !== undefined) token.activeShopId = s.activeShopId ?? undefined;

        if (s.endImpersonation && token.realAdminId) {
          token.id = token.realAdminId as string;
          delete token.realAdminId;
          delete token.impersonatingUserId;
          delete token.impersonatingUserName;
        } else if (s.impersonatingUserId) {
          token.realAdminId = token.id;
          token.impersonatingUserId = s.impersonatingUserId;
          token.impersonatingUserName = s.impersonatingUserName;
          token.id = s.impersonatingUserId;
          if (s.onboarded !== undefined) token.onboarded = s.onboarded;
          if (s.activeShopId !== undefined) token.activeShopId = s.activeShopId ?? undefined;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as { onboarded?: boolean }).onboarded =
          token.onboarded as boolean;
        if (token.activeShopId) {
          (session.user as { activeShopId?: string }).activeShopId = token.activeShopId as string;
        }
        if (token.realAdminId) {
          (session.user as { realAdminId?: string }).realAdminId = token.realAdminId as string;
          (session.user as { impersonatingUserId?: string }).impersonatingUserId = token.impersonatingUserId as string;
          (session.user as { impersonatingUserName?: string }).impersonatingUserName = token.impersonatingUserName as string;
        }
      }
      return session;
    },
  },
  providers: [],
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
};
