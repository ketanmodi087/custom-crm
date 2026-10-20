import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { listPermissionDefs } from "../src/core/rbac/permissions";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@example.com").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const tenant = await prisma.tenant.upsert({
    where: { slug: "default" },
    update: { name: "Default Company", status: "ACTIVE" },
    create: { name: "Default Company", slug: "default", status: "ACTIVE" },
  });

  const permissions = [];
  for (const definition of listPermissionDefs()) {
    permissions.push(
      await prisma.permission.upsert({
        where: { key: definition.key },
        update: { description: definition.description },
        create: definition,
      }),
    );
  }

  const role = await prisma.role.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "admin" } },
    update: { name: "Administrator" },
    create: {
      tenantId: tenant.id,
      name: "Administrator",
      slug: "admin",
      description: "Full CRM access",
    },
  });

  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: role.id, permissionId: permission.id },
      },
      update: {},
      create: { roleId: role.id, permissionId: permission.id },
    });
  }

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      tenantId: tenant.id,
      name: "CRM Administrator",
      passwordHash,
      isActive: true,
    },
    create: {
      tenantId: tenant.id,
      email: adminEmail,
      name: "CRM Administrator",
      passwordHash,
    },
  });

  await prisma.userRoleAssignment.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: { tenantId: tenant.id },
    create: { tenantId: tenant.id, userId: user.id, roleId: role.id },
  });

  console.info("CRM seed completed.");
}

main()
  .catch((error: unknown) => {
    console.error("Failed to seed the CRM.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
