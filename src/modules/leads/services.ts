import { AuditAction } from "@prisma/client";
import { computeFieldDiff, recordAuditLog } from "@/core/audit";
import { prisma } from "@/core/db/prisma";
import {
  findLeadById,
  findLeads,
  insertLead,
  softDeleteLeadRecord,
  updateLeadRecord,
  type LeadWriteData,
} from "./repository";
import type { LeadInput, LeadItem, LeadListResult, LeadQuery } from "./types";

const toNullable = (value: string): string | null => value.trim() || null;

const toWriteData = (input: LeadInput): LeadWriteData => ({
  firstName: input.firstName.trim(),
  lastName: input.lastName.trim(),
  companyName: toNullable(input.companyName),
  email: toNullable(input.email)?.toLowerCase() ?? null,
  phone: toNullable(input.phone),
  status: input.status,
  notes: toNullable(input.notes),
});

const toItem = (lead: {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  status: LeadItem["status"];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): LeadItem => ({
  ...lead,
  createdAt: lead.createdAt.toISOString(),
  updatedAt: lead.updatedAt.toISOString(),
});

/** Returns one active tenant-owned Lead. */
export async function getLead(tenantId: string, id: string): Promise<LeadItem> {
  const lead = await findLeadById(prisma, tenantId, id);
  if (!lead) throw new Error("NOT_FOUND");
  return toItem(lead);
}

/** Lists tenant-scoped leads with search, status filtering, and pagination. */
export async function listLeads(tenantId: string, query: LeadQuery): Promise<LeadListResult> {
  const result = await findLeads(tenantId, query);
  return {
    data: result.data.map(toItem),
    total: result.total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

/** Creates a tenant-scoped lead and its audit entry in one transaction. */
export async function createLead(
  tenantId: string,
  actorId: string,
  input: LeadInput,
): Promise<LeadItem> {
  const lead = await prisma.$transaction(async (transaction) => {
    const created = await insertLead(transaction, tenantId, actorId, toWriteData(input));
    await recordAuditLog(transaction, {
      tenantId,
      entityType: "lead",
      entityId: created.id,
      action: AuditAction.CREATE,
      actorId,
      changes: computeFieldDiff(null, { ...created }),
    });
    return created;
  });
  return toItem(lead);
}

/** Updates a tenant-owned lead and records the field-level change atomically. */
export async function updateLead(
  tenantId: string,
  id: string,
  actorId: string,
  input: LeadInput,
): Promise<LeadItem> {
  const lead = await prisma.$transaction(async (transaction) => {
    const existing = await findLeadById(transaction, tenantId, id);
    if (!existing) throw new Error("NOT_FOUND");
    const updated = await updateLeadRecord(transaction, existing.id, toWriteData(input));
    await recordAuditLog(transaction, {
      tenantId,
      entityType: "lead",
      entityId: existing.id,
      action: AuditAction.UPDATE,
      actorId,
      changes: computeFieldDiff({ ...existing }, { ...updated }),
    });
    return updated;
  });
  return toItem(lead);
}

/** Soft-deletes a tenant-owned lead and records the deletion atomically. */
export async function deleteLead(tenantId: string, id: string, actorId: string): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const existing = await findLeadById(transaction, tenantId, id);
    if (!existing) throw new Error("NOT_FOUND");
    await softDeleteLeadRecord(transaction, existing.id);
    await recordAuditLog(transaction, {
      tenantId,
      entityType: "lead",
      entityId: existing.id,
      action: AuditAction.DELETE,
      actorId,
      changes: { deletedAt: { old: null, new: new Date().toISOString() } },
    });
  });
}
