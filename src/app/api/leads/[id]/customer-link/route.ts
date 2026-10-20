import { jsonError, jsonOk } from "@/core/api/responses";
import { withPermissions } from "@/core/auth/guards";
import { linkLeadToCustomer } from "@/modules/client-lead-customer/services";
import { leadCustomerLinkSchema } from "@/modules/client-lead-customer/types";

/** Links or unlinks a Lead and existing customer master data. */
export const PUT = withPermissions(
  ["leads.write", "customers.read"],
  async (request, { user, params }) => {
    const leadId = params?.id;
    if (!leadId) return jsonError("VALIDATION", "Lead id is required", 400);
    const parsed = leadCustomerLinkSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError("VALIDATION", "Invalid customer connection", 400, parsed.error.flatten());
    }
    return jsonOk(await linkLeadToCustomer(user.tenantId, leadId, user.id, parsed.data));
  },
);
