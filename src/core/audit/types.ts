import type { Prisma } from "@prisma/client";
import { AuditAction } from "@prisma/client";

export { AuditAction };
export type AuditActionType = AuditAction;

export interface FieldChange {
  old: unknown;
  new: unknown;
}

export type AuditChanges = Record<string, FieldChange>;

export interface RecordAuditLogParams {
  tenantId: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  actorId?: string | null;
  changes?: AuditChanges | Prisma.InputJsonValue;
  metadata?: Record<string, unknown> | Prisma.InputJsonValue;
}

export interface AuditLogItem {
  id: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  actorId: string | null;
  actor?: {
    id: string;
    name: string;
    email: string;
  } | null;
  changes: AuditChanges;
  metadata: Record<string, unknown>;
  createdAt: string;
}
