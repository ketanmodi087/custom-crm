import { prisma } from "@/core/db/prisma";

export type AccessScope = {
  tenantId: string;
  permissions: string[];
};

/**
 * Resolves a user's tenant boundary and effective permission union.
 *
 * @throws Error when the user is missing, inactive, or has no active tenant.
 */
export async function getAccessScope(userId: string): Promise<AccessScope> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tenant: { select: { status: true } },
      assignments: {
        include: {
          role: {
            include: { permissions: { include: { permission: true } } },
          },
        },
      },
    },
  });

  if (!user || !user.isActive || user.tenant.status !== "ACTIVE") {
    throw new Error("ACCESS_DENIED");
  }

  const permissions = new Set<string>();
  for (const assignment of user.assignments) {
    if (assignment.tenantId !== user.tenantId || assignment.role.tenantId !== user.tenantId) {
      continue;
    }
    for (const grant of assignment.role.permissions) {
      permissions.add(grant.permission.key);
    }
  }

  return { tenantId: user.tenantId, permissions: [...permissions] };
}
