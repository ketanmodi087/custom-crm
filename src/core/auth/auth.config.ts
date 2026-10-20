import type { NextAuthConfig } from "next-auth";
import "./types";

/** Shared Auth.js configuration safe for route middleware. */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized: () => true,
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.tenantId = user.tenantId;
        token.permissions = user.permissions;
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.id = token.id as string;
      session.user.tenantId = token.tenantId as string;
      session.user.permissions = (token.permissions as string[]) ?? [];
      return session;
    },
  },
} satisfies NextAuthConfig;
