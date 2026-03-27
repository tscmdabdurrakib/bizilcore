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
      if (trigger === "update" && (session as { onboarded?: boolean })?.onboarded !== undefined) {
        token.onboarded = (session as { onboarded?: boolean }).onboarded;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as { onboarded?: boolean }).onboarded =
          token.onboarded as boolean;
      }
      return session;
    },
  },
  providers: [],
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
};
