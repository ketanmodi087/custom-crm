import { jsonError, jsonOk } from "@/core/api/responses";
import { withPermission } from "@/core/auth/guards";
import { deleteLead, getLead, updateLead } from "@/modules/leads/services";
import { leadInputSchema } from "@/modules/leads/types";

/** Returns one tenant-owned Lead. */
export const GET = withPermission("leads.read", async (_request, { user, params }) => {
  const id = params?.id;
  if (!id) return jsonError("VALIDATION", "Lead id is required", 400);
  return jsonOk(await getLead(user.tenantId, id));
});

/** Updates a tenant-owned lead after validating the full editable payload. */
export const PATCH = withPermission("leads.write", async (request, { user, params }) => {
  const id = params?.id;
  if (!id) return jsonError("VALIDATION", "Lead id is required", 400);
  const parsed = leadInputSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("VALIDATION", "Invalid lead data", 400, parsed.error.flatten());
  return jsonOk(await updateLead(user.tenantId, id, user.id, parsed.data));
});

/** Soft-deletes a tenant-owned lead. */
export const DELETE = withPermission("leads.delete", async (_request, { user, params }) => {
  const id = params?.id;
  if (!id) return jsonError("VALIDATION", "Lead id is required", 400);
  await deleteLead(user.tenantId, id, user.id);
  return jsonOk({ success: true });
});
