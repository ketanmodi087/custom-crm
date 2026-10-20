import { jsonError, jsonOk } from "@/core/api/responses";
import { withPermission } from "@/core/auth/guards";
import { createContact, getCustomer } from "@/modules/customers/services";
import { contactInputSchema } from "@/modules/customers/types";

/** Lists active contacts beneath a tenant-owned customer. */
export const GET = withPermission("customers.read", async (_request, { user, params }) => {
  const customerId = params?.id;
  if (!customerId) return jsonError("VALIDATION", "Customer id is required", 400);
  const customer = await getCustomer(user.tenantId, customerId);
  return jsonOk(customer.contacts);
});

/** Creates a contact beneath a tenant-owned customer. */
export const POST = withPermission("customers.write", async (request, { user, params }) => {
  const customerId = params?.id;
  if (!customerId) return jsonError("VALIDATION", "Customer id is required", 400);
  const parsed = contactInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError("VALIDATION", "Invalid contact data", 400, parsed.error.flatten());
  }
  return jsonOk(
    await createContact(user.tenantId, customerId, user.id, parsed.data),
    { status: 201 },
  );
});
