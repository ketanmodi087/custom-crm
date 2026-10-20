import type { CustomerStatus, Prisma } from "@prisma/client";
import { prisma } from "@/core/db/prisma";

type DatabaseClient = typeof prisma | Prisma.TransactionClient;

export type CustomerWriteData = {
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  status: CustomerStatus;
  notes: string | null;
};

export type ContactWriteData = {
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

/** Lists active customers inside one tenant boundary. */
export async function findCustomers(
  tenantId: string,
  options: { q: string; status?: CustomerStatus; page: number; pageSize: number },
) {
  const where: Prisma.CustomerWhereInput = {
    tenantId,
    deletedAt: null,
    ...(options.status ? { status: options.status } : {}),
    ...(options.q
      ? {
          OR: [
            { name: { contains: options.q, mode: "insensitive" } },
            { email: { contains: options.q, mode: "insensitive" } },
            { phone: { contains: options.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: { _count: { select: { contacts: { where: { deletedAt: null } } } } },
      orderBy: { createdAt: "desc" },
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    prisma.customer.count({ where }),
  ]);
  return { data, total };
}

/** Finds one active customer and its active contacts by tenant and identifier. */
export function findCustomerDetail(client: DatabaseClient, tenantId: string, id: string) {
  return client.customer.findFirst({
    where: { id, tenantId, deletedAt: null },
    include: {
      contacts: { where: { deletedAt: null }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] },
    },
  });
}

/** Finds one active customer by tenant and identifier. */
export function findCustomerById(client: DatabaseClient, tenantId: string, id: string) {
  return client.customer.findFirst({ where: { id, tenantId, deletedAt: null } });
}

/** Inserts one tenant-owned customer. */
export function insertCustomer(
  client: DatabaseClient,
  tenantId: string,
  actorId: string,
  data: CustomerWriteData,
) {
  return client.customer.create({
    data: { tenantId, createdById: actorId, updatedById: actorId, ...data },
  });
}

/** Updates one customer after tenant ownership has been verified. */
export function updateCustomerRecord(
  client: DatabaseClient,
  id: string,
  actorId: string,
  data: CustomerWriteData,
) {
  return client.customer.update({ where: { id }, data: { ...data, updatedById: actorId } });
}

/** Finds one active contact beneath an active tenant-owned customer. */
export function findContactById(
  client: DatabaseClient,
  tenantId: string,
  customerId: string,
  id: string,
) {
  return client.contact.findFirst({
    where: {
      id,
      customerId,
      tenantId,
      deletedAt: null,
      customer: { tenantId, deletedAt: null },
    },
  });
}

/** Inserts one contact beneath a verified tenant-owned customer. */
export function insertContact(
  client: DatabaseClient,
  tenantId: string,
  customerId: string,
  actorId: string,
  data: ContactWriteData,
) {
  return client.contact.create({
    data: { tenantId, customerId, createdById: actorId, updatedById: actorId, ...data },
  });
}

/** Updates one contact after customer and tenant ownership have been verified. */
export function updateContactRecord(
  client: DatabaseClient,
  id: string,
  actorId: string,
  data: ContactWriteData,
) {
  return client.contact.update({ where: { id }, data: { ...data, updatedById: actorId } });
}
