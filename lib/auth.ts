import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { updateLoginStreak } from "@/lib/badges";
import { closeUserSession } from "@/lib/activity/sessions";
import { trackUserActivity } from "@/lib/activity/trackUserActivity";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  events: {
    signOut: async (message) => {
      const userId =
        "token" in message && message.token?.id ? (message.token.id as string) : null;
      if (!userId) return;
      await closeUserSession(userId);
      await trackUserActivity({
        userId,
        actionType: "logout",
        actionLabel: "লগআউট করা হয়েছে",
      });
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!isValid) return null;

        // Block unverified accounts from logging in
        if (!user.emailVerified) {
          throw new Error("email_not_verified");
        }

        // Block disabled accounts from logging in
        if (user.accountStatus === "disabled") {
          throw new Error("account_disabled:" + (user.statusReason ?? ""));
        }

        // Update login streak in background — don't block login
        updateLoginStreak(user.id).catch(() => {});

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          onboarded: user.onboarded,
        };
      },
    }),
  ],
});
