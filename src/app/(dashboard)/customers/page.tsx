import { Alert, Container } from "@mui/material";
import { auth } from "@/core/auth/auth";
import { getAccessScope } from "@/core/rbac/scope";
import { CustomersClient } from "@/modules/customers/components/CustomersClient";
import { listCustomers } from "@/modules/customers/services";

/** Renders the tenant-scoped Customers workspace. */
export default async function CustomersPage() {
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

  const initialResult = await listCustomers(scope.tenantId, {
    q: "",
    page: 1,
    pageSize: 20,
  });

  return (
    <CustomersClient
      initialResult={initialResult}
      canWrite={scope.permissions.includes("customers.write")}
      canDelete={scope.permissions.includes("customers.delete")}
    />
  );
}
