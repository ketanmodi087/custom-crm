import { AuditAction } from "@prisma/client";
import { computeFieldDiff, recordAuditLog } from "@/core/audit";
import { prisma } from "@/core/db/prisma";
import {
  findContactById,
  findCustomerById,
  findCustomerDetail,
  findCustomers,
  insertContact,
  insertCustomer,
  updateContactRecord,
  updateCustomerRecord,
  type ContactWriteData,
  type CustomerWriteData,
} from "./repository";
import type {
  ContactInput,
  ContactItem,
  CustomerDetail,
  CustomerInput,
  CustomerItem,
  CustomerListResult,
  CustomerQuery,
} from "./types";

const toNullable = (value: string): string | null => value.trim() || null;

const toCustomerWriteData = (input: CustomerInput): CustomerWriteData => ({
  name: input.name.trim(),
  email: toNullable(input.email)?.toLowerCase() ?? null,
  phone: toNullable(input.phone),
  website: toNullable(input.website),
  address: toNullable(input.address),
  status: input.status,
  notes: toNullable(input.notes),
});

const toContactWriteData = (input: ContactInput): ContactWriteData => ({
  firstName: input.firstName.trim(),
  lastName: input.lastName.trim(),
  jobTitle: toNullable(input.jobTitle),
  email: toNullable(input.email)?.toLowerCase() ?? null,
  phone: toNullable(input.phone),
  notes: toNullable(input.notes),
});

const toCustomerItem = (customer: {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  status: CustomerItem["status"];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { contacts: number };
}): CustomerItem => ({
  id: customer.id,
  name: customer.name,
  email: customer.email,
  phone: customer.phone,
  website: customer.website,
  address: customer.address,
  status: customer.status,
  notes: customer.notes,
  contactCount: customer._count?.contacts ?? 0,
  createdAt: customer.createdAt.toISOString(),
  updatedAt: customer.updatedAt.toISOString(),
});

const toContactItem = (contact: {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ContactItem => ({
  ...contact,
  createdAt: contact.createdAt.toISOString(),
  updatedAt: contact.updatedAt.toISOString(),
});

/** Lists tenant-scoped customers with search, status filtering, and pagination. */
export async function listCustomers(
  tenantId: string,
  query: CustomerQuery,
): Promise<CustomerListResult> {
  const result = await findCustomers(tenantId, query);
  return {
    data: result.data.map(toCustomerItem),
    total: result.total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

/** Returns one tenant-owned customer together with active contacts. */
export async function getCustomer(tenantId: string, id: string): Promise<CustomerDetail> {
  const customer = await findCustomerDetail(prisma, tenantId, id);
  if (!customer) throw new Error("NOT_FOUND");
  return {
    ...toCustomerItem({ ...customer, _count: { contacts: customer.contacts.length } }),
    contacts: customer.contacts.map(toContactItem),
  };
}

/** Creates a tenant-scoped customer and its audit entry in one transaction. */
export async function createCustomer(
  tenantId: string,
  actorId: string,
  input: CustomerInput,
): Promise<CustomerItem> {
  const customer = await prisma.$transaction(async (transaction) => {
    const created = await insertCustomer(
      transaction,
      tenantId,
      actorId,
      toCustomerWriteData(input),
    );
    await recordAuditLog(transaction, {
      tenantId,
      entityType: "customer",
      entityId: created.id,
      action: AuditAction.CREATE,
      actorId,
      changes: computeFieldDiff(null, { ...created }),
    });
    return created;
  });
  return toCustomerItem(customer);
}

/** Updates a tenant-owned customer and records the field-level change atomically. */
export async function updateCustomer(
  tenantId: string,
  id: string,
  actorId: string,
  input: CustomerInput,
): Promise<CustomerItem> {
  const customer = await prisma.$transaction(async (transaction) => {
    const existing = await findCustomerById(transaction, tenantId, id);
    if (!existing) throw new Error("NOT_FOUND");
    const updated = await updateCustomerRecord(
      transaction,
      existing.id,
      actorId,
      toCustomerWriteData(input),
    );
    await recordAuditLog(transaction, {
      tenantId,
      entityType: "customer",
      entityId: existing.id,
      action: AuditAction.UPDATE,
      actorId,
      changes: computeFieldDiff({ ...existing }, { ...updated }),
    });
    return updated;
  });
  return toCustomerItem(customer);
}

/** Creates a contact only after verifying its customer belongs to the same tenant. */
export async function createContact(
  tenantId: string,
  customerId: string,
  actorId: string,
  input: ContactInput,
): Promise<ContactItem> {
  const contact = await prisma.$transaction(async (transaction) => {
    const customer = await findCustomerById(transaction, tenantId, customerId);
    if (!customer) throw new Error("NOT_FOUND");
    const created = await insertContact(
      transaction,
      tenantId,
      customer.id,
      actorId,
      toContactWriteData(input),
    );
    await recordAuditLog(transaction, {
      tenantId,
      entityType: "contact",
      entityId: created.id,
      action: AuditAction.CREATE,
      actorId,
      changes: computeFieldDiff(null, { ...created }),
      metadata: { customerId: customer.id },
    });
    return created;
  });
  return toContactItem(contact);
}

/** Updates a tenant-owned contact and records the field-level change atomically. */
export async function updateContact(
  tenantId: string,
  customerId: string,
  id: string,
  actorId: string,
  input: ContactInput,
): Promise<ContactItem> {
  const contact = await prisma.$transaction(async (transaction) => {
    const existing = await findContactById(transaction, tenantId, customerId, id);
    if (!existing) throw new Error("NOT_FOUND");
    const updated = await updateContactRecord(
      transaction,
      existing.id,
      actorId,
      toContactWriteData(input),
    );
    await recordAuditLog(transaction, {
      tenantId,
      entityType: "contact",
      entityId: existing.id,
      action: AuditAction.UPDATE,
      actorId,
      changes: computeFieldDiff({ ...existing }, { ...updated }),
      metadata: { customerId },
    });
    return updated;
  });
  return toContactItem(contact);
}
