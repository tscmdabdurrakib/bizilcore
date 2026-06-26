import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      onboarded?: boolean;
      activeShopId?: string;
      realAdminId?: string;
      impersonatingUserId?: string;
      impersonatingUserName?: string;
    };
  }

  interface User {
    onboarded?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    onboarded?: boolean;
    activeShopId?: string;
    realAdminId?: string;
    impersonatingUserId?: string;
    impersonatingUserName?: string;
  }
}
