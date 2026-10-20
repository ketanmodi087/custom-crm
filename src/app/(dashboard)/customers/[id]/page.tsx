import { Alert, Container } from "@mui/material";
import { notFound } from "next/navigation";
import { auth } from "@/core/auth/auth";
import { getAccessScope } from "@/core/rbac/scope";
import { CustomerDetailClient } from "@/modules/customers/components/CustomerDetailClient";
import { getCustomer } from "@/modules/customers/services";
import { CustomerRelatedLeads } from "@/modules/client-lead-customer/components/CustomerRelatedLeads";
import { listRelatedLeads } from "@/modules/client-lead-customer/services";

/** Renders one tenant-scoped customer and its contacts. */
export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const scope = session?.user.id ? await getAccessScope(session.user.id).catch(() => null) : null;
  const canRead = scope?.permissions.includes("customers.read") ?? false;

  if (!scope || !canRead) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="warning">You do not have permission to view customers.</Alert>
      </Container>
    );
  }

  const { id } = await params;
  const customer = await getCustomer(scope.tenantId, id).catch((error: unknown) => {
    if (error instanceof Error && error.message === "NOT_FOUND") return null;
    throw error;
  });
  if (!customer) notFound();
  const relatedLeads = scope.permissions.includes("leads.read")
    ? await listRelatedLeads(scope.tenantId, customer.id)
    : null;

  return (
    <CustomerDetailClient
      initialCustomer={customer}
      canWrite={scope.permissions.includes("customers.write")}
      canDelete={scope.permissions.includes("customers.delete")}
      relatedContent={relatedLeads ? <CustomerRelatedLeads leads={relatedLeads} /> : undefined}
    />
  );
}
