import { jsonError, jsonOk } from "@/core/api/responses";
import { withPermission } from "@/core/auth/guards";
import { createLead, listLeads } from "@/modules/leads/services";
import { leadInputSchema, leadQuerySchema } from "@/modules/leads/types";

/** Lists leads owned by the authenticated user's tenant. */
export const GET = withPermission("leads.read", async (request, { user }) => {
  const url = new URL(request.url);
  const parsed = leadQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return jsonError("VALIDATION", "Invalid list filters", 400, parsed.error.flatten());
  return jsonOk(await listLeads(user.tenantId, parsed.data));
});

/** Creates a lead inside the authenticated user's tenant. */
export const POST = withPermission("leads.write", async (request, { user }) => {
  const parsed = leadInputSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("VALIDATION", "Invalid lead data", 400, parsed.error.flatten());
  return jsonOk(await createLead(user.tenantId, user.id, parsed.data), { status: 201 });
});
