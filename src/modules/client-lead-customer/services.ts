import { AuditAction } from "@prisma/client";
import { computeFieldDiff, recordAuditLog } from "@/core/audit";
import { prisma } from "@/core/db/prisma";
import {
  claimLeadConversion,
  countContactLeadLinks,
  countCustomerLeadLinks,
  findCustomerOptions,
  findIntegrationContact,
  findIntegrationCustomer,
  findLeadForIntegration,
  findRelatedLeads,
  insertConvertedContact,
  insertConvertedCustomer,
  softDeleteIntegratedContact,
  softDeleteIntegratedCustomer,
  updateLeadConnection,
} from "./repository";
import type {
  CustomerOption,
  LeadConnection,
  LeadCustomerLinkInput,
  RelatedLeadItem,
} from "./types";

const toConnection = (lead: {
  customerId: string | null;
  contactId: string | null;
  convertedAt: Date | null;
  customer: { name: string; deletedAt: Date | null } | null;
  contact: { firstName: string; lastName: string; deletedAt: Date | null } | null;
}): LeadConnection => ({
  customerId: lead.customer?.deletedAt ? null : lead.customerId,
  customerName: lead.customer?.deletedAt ? null : (lead.customer?.name ?? null),
  contactId: lead.contact?.deletedAt ? null : lead.contactId,
  contactName: lead.contact?.deletedAt
    ? null
    : lead.contact
      ? `${lead.contact.firstName} ${lead.contact.lastName}`
      : null,
  convertedAt: lead.convertedAt?.toISOString() ?? null,
});

/** Lists valid Customer and Contact choices for Lead linking. */
export async function listCustomerOptions(tenantId: string): Promise<CustomerOption[]> {
  return findCustomerOptions(tenantId);
}

/** Returns the current tenant-validated master-data connection for a Lead. */
export async function getLeadConnection(tenantId: string, leadId: string): Promise<LeadConnection> {
  const lead = await findLeadForIntegration(prisma, tenantId, leadId);
  if (!lead) throw new Error("NOT_FOUND");
  return toConnection(lead);
}

/** Links or unlinks an existing Customer/Contact after validating all tenant ownership. */
export async function linkLeadToCustomer(
  tenantId: string,
  leadId: string,
  actorId: string,
  input: LeadCustomerLinkInput,
): Promise<LeadConnection> {
  const updated = await prisma.$transaction(async (transaction) => {
    const lead = await findLeadForIntegration(transaction, tenantId, leadId);
    if (!lead) throw new Error("NOT_FOUND");
    if (lead.convertedAt) throw new Error("ALREADY_CONVERTED");

    if (input.customerId) {
      const customer = await findIntegrationCustomer(transaction, tenantId, input.customerId);
      if (!customer || customer.status !== "ACTIVE") throw new Error("CUSTOMER_NOT_FOUND");
      if (input.contactId) {
        const contact = await findIntegrationContact(
          transaction,
          tenantId,
          customer.id,
          input.contactId,
        );
        if (!contact) throw new Error("CONTACT_CUSTOMER_MISMATCH");
      }
    }

    const result = await updateLeadConnection(transaction, lead.id, input);
    await recordAuditLog(transaction, {
      tenantId,
      entityType: "lead",
      entityId: lead.id,
      action: AuditAction.UPDATE,
      actorId,
      changes: computeFieldDiff(
        { customerId: lead.customerId, contactId: lead.contactId },
        { customerId: result.customerId, contactId: result.contactId },
      ),
      metadata: { operation: input.customerId ? "link_customer" : "unlink_customer" },
    });
    return findLeadForIntegration(transaction, tenantId, lead.id);
  });
  if (!updated) throw new Error("NOT_FOUND");
  return toConnection(updated);
}

/** Converts one qualified Lead into a new Customer and Contact in a single transaction. */
export async function convertLeadToCustomer(
  tenantId: string,
  leadId: string,
  actorId: string,
): Promise<LeadConnection> {
  const converted = await prisma.$transaction(async (transaction) => {
    const lead = await findLeadForIntegration(transaction, tenantId, leadId);
    if (!lead) throw new Error("NOT_FOUND");
    if (lead.status !== "QUALIFIED") throw new Error("LEAD_NOT_QUALIFIED");
    if (lead.customerId || lead.convertedAt) throw new Error("ALREADY_CONVERTED");

    const customer = await insertConvertedCustomer(transaction, tenantId, actorId, {
      name: lead.companyName?.trim() || `${lead.firstName} ${lead.lastName}`,
      email: lead.email,
      phone: lead.phone,
      notes: lead.notes,
    });
    const contact = await insertConvertedContact(
      transaction,
      tenantId,
      customer.id,
      actorId,
      {
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        notes: lead.notes,
      },
    );
    const convertedAt = new Date();
    const claim = await claimLeadConversion(
      transaction,
      tenantId,
      lead.id,
      customer.id,
      contact.id,
      convertedAt,
    );
    if (claim.count !== 1) throw new Error("ALREADY_CONVERTED");

    await recordAuditLog(transaction, {
      tenantId,
      entityType: "customer",
      entityId: customer.id,
      action: AuditAction.CREATE,
      actorId,
      changes: computeFieldDiff(null, { ...customer }),
      metadata: { sourceType: "lead", sourceId: lead.id },
    });
    await recordAuditLog(transaction, {
      tenantId,
      entityType: "contact",
      entityId: contact.id,
      action: AuditAction.CREATE,
      actorId,
      changes: computeFieldDiff(null, { ...contact }),
      metadata: { sourceType: "lead", sourceId: lead.id, customerId: customer.id },
    });
    await recordAuditLog(transaction, {
      tenantId,
      entityType: "lead",
      entityId: lead.id,
      action: AuditAction.UPDATE,
      actorId,
      changes: {
        customerId: { old: null, new: customer.id },
        contactId: { old: null, new: contact.id },
        convertedAt: { old: null, new: convertedAt.toISOString() },
      },
      metadata: { operation: "convert_to_customer" },
    });
    return findLeadForIntegration(transaction, tenantId, lead.id);
  });
  if (!converted) throw new Error("NOT_FOUND");
  return toConnection(converted);
}

/** Lists active Leads connected to one tenant-owned Customer. */
export async function listRelatedLeads(
  tenantId: string,
  customerId: string,
): Promise<RelatedLeadItem[]> {
  const customer = await findIntegrationCustomer(prisma, tenantId, customerId);
  if (!customer) throw new Error("NOT_FOUND");
  const leads = await findRelatedLeads(tenantId, customerId);
  return leads.map((lead) => ({
    ...lead,
    convertedAt: lead.convertedAt?.toISOString() ?? null,
  }));
}

/** Deletes a Customer only when no active Leads reference it. */
export async function deleteUnlinkedCustomer(
  tenantId: string,
  customerId: string,
  actorId: string,
): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const customer = await findIntegrationCustomer(transaction, tenantId, customerId);
    if (!customer) throw new Error("NOT_FOUND");
    if ((await countCustomerLeadLinks(transaction, tenantId, customer.id)) > 0) {
      throw new Error("CUSTOMER_IN_USE");
    }
    const deletedAt = new Date();
    await softDeleteIntegratedCustomer(transaction, customer.id, actorId, deletedAt);
    await recordAuditLog(transaction, {
      tenantId,
      entityType: "customer",
      entityId: customer.id,
      action: AuditAction.DELETE,
      actorId,
      changes: { deletedAt: { old: null, new: deletedAt.toISOString() } },
    });
  });
}

/** Deletes a Contact only when no active Leads reference it. */
export async function deleteUnlinkedContact(
  tenantId: string,
  customerId: string,
  contactId: string,
  actorId: string,
): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const contact = await findIntegrationContact(transaction, tenantId, customerId, contactId);
    if (!contact) throw new Error("NOT_FOUND");
    if ((await countContactLeadLinks(transaction, tenantId, contact.id)) > 0) {
      throw new Error("CONTACT_IN_USE");
    }
    const deletedAt = new Date();
    await softDeleteIntegratedContact(transaction, contact.id, actorId, deletedAt);
    await recordAuditLog(transaction, {
      tenantId,
      entityType: "contact",
      entityId: contact.id,
      action: AuditAction.DELETE,
      actorId,
      changes: { deletedAt: { old: null, new: deletedAt.toISOString() } },
      metadata: { customerId },
    });
  });
}
