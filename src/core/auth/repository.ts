import { prisma } from "@/core/db/prisma";

/** Finds a user and tenant needed for credential authentication. */
export function findCredentialsUser(email: string) {
  return prisma.user.findUnique({ where: { email }, include: { tenant: true } });
}

/** Lists role grants for a user inside one tenant. */
export function findPermissionAssignments(userId: string, tenantId: string) {
  return prisma.userRoleAssignment.findMany({
    where: { userId, tenantId, role: { tenantId } },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });
}

/** Checks that a session still belongs to an active user and tenant. */
export async function isActiveSessionUser(userId: string, tenantId: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId, isActive: true, tenant: { status: "ACTIVE" } },
    select: { id: true },
  });
  return Boolean(user);
}

/** Finds an account eligible to receive a password-reset token. */
export function findPasswordResetUser(email: string) {
  return prisma.user.findUnique({ where: { email }, select: { email: true, isActive: true } });
}

/** Replaces prior reset tokens with a new single-use token. */
export function replacePasswordResetToken(email: string, token: string, expiresAt: Date) {
  return prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { email } }),
    prisma.passwordResetToken.create({ data: { email, token, expiresAt } }),
  ]);
}

/** Finds a password-reset token by normalized email and hashed token. */
export function findPasswordResetToken(email: string, token: string) {
  return prisma.passwordResetToken.findUnique({ where: { email_token: { email, token } } });
}

/** Updates the password and invalidates every outstanding token atomically. */
export function updatePasswordAndConsumeTokens(email: string, passwordHash: string) {
  return prisma.$transaction([
    prisma.user.update({ where: { email }, data: { passwordHash } }),
    prisma.passwordResetToken.deleteMany({ where: { email } }),
  ]);
}
