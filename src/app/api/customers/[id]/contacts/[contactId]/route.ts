import { jsonError, jsonOk } from "@/core/api/responses";
import { withPermission } from "@/core/auth/guards";
import { updateContact } from "@/modules/customers/services";
import { deleteUnlinkedContact } from "@/modules/client-lead-customer/services";
import { contactInputSchema } from "@/modules/customers/types";

/** Updates a contact after validating its customer and tenant ownership. */
export const PATCH = withPermission("customers.write", async (request, { user, params }) => {
  const customerId = params?.id;
  const contactId = params?.contactId;
  if (!customerId || !contactId) {
    return jsonError("VALIDATION", "Customer and contact ids are required", 400);
  }
  const parsed = contactInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError("VALIDATION", "Invalid contact data", 400, parsed.error.flatten());
  }
  return jsonOk(
    await updateContact(user.tenantId, customerId, contactId, user.id, parsed.data),
  );
});

/** Soft-deletes a contact after validating its customer and tenant ownership. */
export const DELETE = withPermission("customers.delete", async (_request, { user, params }) => {
  const customerId = params?.id;
  const contactId = params?.contactId;
  if (!customerId || !contactId) {
    return jsonError("VALIDATION", "Customer and contact ids are required", 400);
  }
  await deleteUnlinkedContact(user.tenantId, customerId, contactId, user.id);
  return jsonOk({ success: true });
});
