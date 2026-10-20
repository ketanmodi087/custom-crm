import { Alert, Container } from "@mui/material";
import { notFound } from "next/navigation";
import { auth } from "@/core/auth/auth";
import { getAccessScope } from "@/core/rbac/scope";
import { LeadConnectionPanel } from "@/modules/client-lead-customer/components/LeadConnectionPanel";
import {
  getLeadConnection,
  listCustomerOptions,
} from "@/modules/client-lead-customer/services";
import { LeadDetailSummary } from "@/modules/leads/components/LeadDetailSummary";
import { getLead } from "@/modules/leads/services";

/** Renders a Lead profile with client-specific Customer/Contact integration. */
export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const scope = session?.user.id ? await getAccessScope(session.user.id).catch(() => null) : null;
  if (!scope || !scope.permissions.includes("leads.read")) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="warning">You do not have permission to view leads.</Alert>
      </Container>
    );
  }

  const { id } = await params;
  const lead = await getLead(scope.tenantId, id).catch((error: unknown) => {
    if (error instanceof Error && error.message === "NOT_FOUND") return null;
    throw error;
  });
  if (!lead) notFound();

  const canReadCustomers = scope.permissions.includes("customers.read");
  const [connection, options] = canReadCustomers
    ? await Promise.all([
        getLeadConnection(scope.tenantId, lead.id),
        listCustomerOptions(scope.tenantId),
      ])
    : [null, []];

  return (
    <LeadDetailSummary
      lead={lead}
      integrationContent={connection ? (
        <LeadConnectionPanel
          lead={{
            id: lead.id,
            firstName: lead.firstName,
            lastName: lead.lastName,
            companyName: lead.companyName,
            status: lead.status,
          }}
          initialConnection={connection}
          customerOptions={options}
          canLink={scope.permissions.includes("leads.write") && canReadCustomers}
          canConvert={
            scope.permissions.includes("leads.write") &&
            scope.permissions.includes("customers.write")
          }
        />
      ) : (
        <Alert severity="info">Customer access is required to view or manage this connection.</Alert>
      )}
    />
  );
}
