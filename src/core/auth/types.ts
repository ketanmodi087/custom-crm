import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string;
      permissions: string[];
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    tenantId: string;
    permissions: string[];
  }

}
