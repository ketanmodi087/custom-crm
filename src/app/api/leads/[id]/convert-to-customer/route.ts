import { jsonError, jsonOk } from "@/core/api/responses";
import { withPermissions } from "@/core/auth/guards";
import { convertLeadToCustomer } from "@/modules/client-lead-customer/services";

/** Converts a qualified Lead into new customer master data. */
export const POST = withPermissions(
  ["leads.write", "customers.write"],
  async (_request, { user, params }) => {
    const leadId = params?.id;
    if (!leadId) return jsonError("VALIDATION", "Lead id is required", 400);
    return jsonOk(await convertLeadToCustomer(user.tenantId, leadId, user.id));
  },
);
