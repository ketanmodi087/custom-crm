import { jsonError, jsonOk } from "@/core/api/responses";
import { withPermission } from "@/core/auth/guards";
import { createCustomer, listCustomers } from "@/modules/customers/services";
import { customerInputSchema, customerQuerySchema } from "@/modules/customers/types";

/** Lists customers owned by the authenticated user's tenant. */
export const GET = withPermission("customers.read", async (request, { user }) => {
  const url = new URL(request.url);
  const parsed = customerQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return jsonError("VALIDATION", "Invalid list filters", 400, parsed.error.flatten());
  }
  return jsonOk(await listCustomers(user.tenantId, parsed.data));
});

/** Creates a customer inside the authenticated user's tenant. */
export const POST = withPermission("customers.write", async (request, { user }) => {
  const parsed = customerInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError("VALIDATION", "Invalid customer data", 400, parsed.error.flatten());
  }
  return jsonOk(await createCustomer(user.tenantId, user.id, parsed.data), { status: 201 });
});
