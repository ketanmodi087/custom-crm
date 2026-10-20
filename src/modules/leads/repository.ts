import { prisma } from "@/core/db/prisma";
import type { LeadStatus, Prisma } from "@prisma/client";

type DatabaseClient = typeof prisma | Prisma.TransactionClient;

export type LeadWriteData = {
  firstName: string;
  lastName: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  notes: string | null;
};

/** Lists active leads inside one tenant boundary. */
export async function findLeads(
  tenantId: string,
  options: { q: string; status?: LeadStatus; page: number; pageSize: number },
) {
  const where: Prisma.LeadWhereInput = {
    tenantId,
    deletedAt: null,
    ...(options.status ? { status: options.status } : {}),
    ...(options.q
      ? {
          OR: [
            { firstName: { contains: options.q, mode: "insensitive" } },
            { lastName: { contains: options.q, mode: "insensitive" } },
            { companyName: { contains: options.q, mode: "insensitive" } },
            { email: { contains: options.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    prisma.lead.count({ where }),
  ]);
  return { data, total };
}

/** Finds one active lead by tenant and identifier. */
export function findLeadById(client: DatabaseClient, tenantId: string, id: string) {
  return client.lead.findFirst({ where: { id, tenantId, deletedAt: null } });
}

/** Inserts one tenant-owned lead. */
export function insertLead(
  client: DatabaseClient,
  tenantId: string,
  actorId: string,
  data: LeadWriteData,
) {
  return client.lead.create({ data: { tenantId, createdById: actorId, ...data } });
}

/** Updates one lead after its tenant ownership has been verified. */
export function updateLeadRecord(client: DatabaseClient, id: string, data: LeadWriteData) {
  return client.lead.update({ where: { id }, data });
}

/** Soft-deletes one lead after its tenant ownership has been verified. */
export function softDeleteLeadRecord(client: DatabaseClient, id: string) {
  return client.lead.update({ where: { id }, data: { deletedAt: new Date() } });
}
