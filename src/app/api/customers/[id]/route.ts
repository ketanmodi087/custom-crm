import { jsonError, jsonOk } from "@/core/api/responses";
import { withPermission } from "@/core/auth/guards";
import { getCustomer, updateCustomer } from "@/modules/customers/services";
import { deleteUnlinkedCustomer } from "@/modules/client-lead-customer/services";
import { customerInputSchema } from "@/modules/customers/types";

/** Returns one tenant-owned customer and its contacts. */
export const GET = withPermission("customers.read", async (_request, { user, params }) => {
  const id = params?.id;
  if (!id) return jsonError("VALIDATION", "Customer id is required", 400);
  return jsonOk(await getCustomer(user.tenantId, id));
});

/** Updates a tenant-owned customer after validating the full editable payload. */
export const PATCH = withPermission("customers.write", async (request, { user, params }) => {
  const id = params?.id;
  if (!id) return jsonError("VALIDATION", "Customer id is required", 400);
  const parsed = customerInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError("VALIDATION", "Invalid customer data", 400, parsed.error.flatten());
  }
  return jsonOk(await updateCustomer(user.tenantId, id, user.id, parsed.data));
});

/** Soft-deletes a tenant-owned customer. */
export const DELETE = withPermission("customers.delete", async (_request, { user, params }) => {
  const id = params?.id;
  if (!id) return jsonError("VALIDATION", "Customer id is required", 400);
  await deleteUnlinkedCustomer(user.tenantId, id, user.id);
  return jsonOk({ success: true });
});
