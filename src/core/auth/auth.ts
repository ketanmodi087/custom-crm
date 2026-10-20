import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { findCredentialsUser, findPermissionAssignments } from "./repository";
import "./types";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** Loads the permission union assigned to a user within their tenant. */
async function getUserPermissions(userId: string, tenantId: string): Promise<string[]> {
  const assignments = await findPermissionAssignments(userId, tenantId);

  return [
    ...new Set(
      assignments.flatMap((assignment) =>
        assignment.role.permissions.map((grant) => grant.permission.key),
      ),
    ),
  ];
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (rawCredentials) => {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const user = await findCredentialsUser(parsed.data.email.toLowerCase().trim());

        if (!user || !user.isActive || user.tenant.status !== "ACTIVE") return null;
        if (!(await bcrypt.compare(parsed.data.password, user.passwordHash))) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          permissions: await getUserPermissions(user.id, user.tenantId),
        };
      },
    }),
  ],
});
