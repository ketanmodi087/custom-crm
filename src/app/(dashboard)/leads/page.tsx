import { Alert, Container } from "@mui/material";
import { auth } from "@/core/auth/auth";
import { getAccessScope } from "@/core/rbac/scope";
import { listLeads } from "@/modules/leads/services";
import { LeadsClient } from "@/modules/leads/components/LeadsClient";

/** Renders the tenant-scoped Leads workspace. */
export default async function LeadsPage() {
  const session = await auth();
  const scope = session?.user.id ? await getAccessScope(session.user.id).catch(() => null) : null;
  const canRead = scope?.permissions.includes("leads.read") ?? false;

  if (!scope || !canRead) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="warning">You do not have permission to view leads.</Alert>
      </Container>
    );
  }

  const initialResult = await listLeads(scope.tenantId, {
    q: "",
    page: 1,
    pageSize: 20,
  });

  return (
    <LeadsClient
      initialResult={initialResult}
      canWrite={scope.permissions.includes("leads.write")}
      canDelete={scope.permissions.includes("leads.delete")}
    />
  );
}
