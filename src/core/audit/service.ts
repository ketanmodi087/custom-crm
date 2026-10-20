import { prisma } from "@/core/db/prisma";
import type { Prisma } from "@prisma/client";
import type { AuditChanges, AuditLogItem, RecordAuditLogParams } from "./types";

/**
 * Standard system attributes that should not be tracked in user-facing audit diffs.
 */
const DEFAULT_IGNORED_KEYS = new Set([
  "updatedAt",
  "createdAt",
  "deletedAt",
  "id",
  "tenantId",
  "passwordHash",
]);

/**
 * Safely converts any value (Prisma Decimal, Date, Array, Object) to JSON-serializable primitive.
 */
const serializeValue = (val: unknown): unknown => {
  if (val === null || val === undefined) return null;
  if (typeof val === "object" && val !== null && "toNumber" in val && typeof (val as { toNumber: () => number }).toNumber === "function") {
    return (val as { toNumber: () => number }).toNumber();
  }
  if (val instanceof Date) return val.toISOString();
  if (Array.isArray(val)) return val.map(serializeValue);
  if (typeof val === "object") {
    try {
      return JSON.parse(JSON.stringify(val));
    } catch {
      return String(val);
    }
  }
  return val;
};

/**
 * Computes field-level difference between previous and current record state.
 * @param oldData Previous entity snapshot
 * @param newData Updated entity data
 * @param options Custom ignored keys
 * @returns Map of changed fields with `{ old, new }`
 */
export const computeFieldDiff = (
  oldData: Record<string, unknown> | null | undefined,
  newData: Record<string, unknown> | null | undefined,
  options?: {
    ignoredKeys?: Set<string>;
  },
): AuditChanges => {
  const diff: AuditChanges = {};
  if (!oldData && !newData) return diff;

  const ignored = options?.ignoredKeys ?? DEFAULT_IGNORED_KEYS;

  const allKeys = new Set([
    ...Object.keys(oldData ?? {}),
    ...Object.keys(newData ?? {}),
  ]);

  for (const key of allKeys) {
    if (ignored.has(key)) continue;

    const oldRaw = oldData ? oldData[key] : undefined;
    const newRaw = newData ? newData[key] : undefined;

    if (typeof oldRaw === "function" || typeof newRaw === "function") continue;

    const oldVal = serializeValue(oldRaw);
    const newVal = serializeValue(newRaw);

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff[key] = {
        old: oldVal,
        new: newVal,
      };
    }
  }

  return diff;
};

/**
 * Records an audit log entry in the database.
 * Designed to execute inside the same Prisma transaction as the business mutation.
 *
 * @param txOrPrisma Transaction client or default Prisma client
 * @param params Audit parameters including entity, action, actor, and changes
 */
export const recordAuditLog = async (
  txOrPrisma: Prisma.TransactionClient | typeof prisma,
  params: RecordAuditLogParams,
) => {
  return txOrPrisma.auditLog.create({
    data: {
      tenantId: params.tenantId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      actorId: params.actorId ?? null,
      changes: (params.changes ?? {}) as Prisma.InputJsonValue,
      metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
};

/**
 * Retrieves chronological audit history for a specific business entity.
 *
 * @param tenantId Tenant partition key
 * @param entityType Name of entity type (e.g. "inquiry", "quote")
 * @param entityId Specific entity ID
 * @param options Pagination limits
 */
export const getAuditLogsForEntity = async (
  tenantId: string,
  entityType: string,
  entityId: string,
  options?: { limit?: number; offset?: number },
): Promise<AuditLogItem[]> => {
  const logs = await prisma.auditLog.findMany({
    where: {
      tenantId,
      entityType,
      entityId,
    },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 100,
    skip: options?.offset ?? 0,
  });

  return logs.map((log) => ({
    id: log.id,
    tenantId: log.tenantId,
    entityType: log.entityType,
    entityId: log.entityId,
    action: log.action,
    actorId: log.actorId,
    actor: log.actor,
    changes: (log.changes ?? {}) as unknown as AuditChanges,
    metadata: (log.metadata ?? {}) as unknown as Record<string, unknown>,
    createdAt: log.createdAt.toISOString(),
  }));
};
