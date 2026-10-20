import type { Prisma } from "@prisma/client";
import { prisma } from "@/core/db/prisma";

type DatabaseClient = typeof prisma | Prisma.TransactionClient;

/** Lists active customer and contact choices inside a tenant boundary. */
export function findCustomerOptions(tenantId: string) {
  return prisma.customer.findMany({
    where: { tenantId, deletedAt: null, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      contacts: {
        where: { deletedAt: null },
        select: { id: true, firstName: true, lastName: true, email: true },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });
}

/** Finds an active Lead and its current customer connection inside one tenant. */
export function findLeadForIntegration(client: DatabaseClient, tenantId: string, id: string) {
  return client.lead.findFirst({
    where: { id, tenantId, deletedAt: null },
    include: {
      customer: { select: { id: true, name: true, deletedAt: true } },
      contact: { select: { id: true, firstName: true, lastName: true, deletedAt: true } },
    },
  });
}

/** Finds an active tenant-owned Customer for connection validation. */
export function findIntegrationCustomer(
  client: DatabaseClient,
  tenantId: string,
  customerId: string,
) {
  return client.customer.findFirst({
    where: { id: customerId, tenantId, deletedAt: null },
  });
}

/** Finds an active Contact that belongs to the specified tenant-owned Customer. */
export function findIntegrationContact(
  client: DatabaseClient,
  tenantId: string,
  customerId: string,
  contactId: string,
) {
  return client.contact.findFirst({
    where: { id: contactId, customerId, tenantId, deletedAt: null },
  });
}

/** Updates the Customer/Contact connection for a verified Lead. */
export function updateLeadConnection(
  client: DatabaseClient,
  leadId: string,
  data: { customerId: string | null; contactId: string | null },
) {
  return client.lead.update({ where: { id: leadId }, data });
}

/** Inserts the Customer created during Lead conversion. */
export function insertConvertedCustomer(
  client: DatabaseClient,
  tenantId: string,
  actorId: string,
  data: { name: string; email: string | null; phone: string | null; notes: string | null },
) {
  return client.customer.create({
    data: {
      tenantId,
      createdById: actorId,
      updatedById: actorId,
      status: "ACTIVE",
      website: null,
      address: null,
      ...data,
    },
  });
}

/** Inserts the Contact created during Lead conversion. */
export function insertConvertedContact(
  client: DatabaseClient,
  tenantId: string,
  customerId: string,
  actorId: string,
  data: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    notes: string | null;
  },
) {
  return client.contact.create({
    data: {
      tenantId,
      customerId,
      createdById: actorId,
      updatedById: actorId,
      jobTitle: null,
      ...data,
    },
  });
}

/** Atomically claims an unconnected Lead for conversion and stores created master-data links. */
export function claimLeadConversion(
  client: DatabaseClient,
  tenantId: string,
  leadId: string,
  customerId: string,
  contactId: string,
  convertedAt: Date,
) {
  return client.lead.updateMany({
    where: { id: leadId, tenantId, deletedAt: null, customerId: null, convertedAt: null },
    data: { customerId, contactId, convertedAt },
  });
}

/** Lists active Leads connected to one tenant-owned Customer. */
export function findRelatedLeads(tenantId: string, customerId: string) {
  return prisma.lead.findMany({
    where: { tenantId, customerId, deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
      convertedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Counts active Leads connected to one Customer. */
export function countCustomerLeadLinks(
  client: DatabaseClient,
  tenantId: string,
  customerId: string,
) {
  return client.lead.count({ where: { tenantId, customerId, deletedAt: null } });
}

/** Counts active Leads connected to one Contact. */
export function countContactLeadLinks(
  client: DatabaseClient,
  tenantId: string,
  contactId: string,
) {
  return client.lead.count({ where: { tenantId, contactId, deletedAt: null } });
}

/** Soft-deletes a verified Customer from the integration workflow. */
export function softDeleteIntegratedCustomer(
  client: DatabaseClient,
  id: string,
  actorId: string,
  deletedAt: Date,
) {
  return client.customer.update({
    where: { id },
    data: { deletedAt, updatedById: actorId },
  });
}

/** Soft-deletes a verified Contact from the integration workflow. */
export function softDeleteIntegratedContact(
  client: DatabaseClient,
  id: string,
  actorId: string,
  deletedAt: Date,
) {
  return client.contact.update({
    where: { id },
    data: { deletedAt, updatedById: actorId },
  });
}
