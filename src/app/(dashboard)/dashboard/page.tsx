import { Container, Paper, Stack, Typography } from "@mui/material";
import { auth } from "@/core/auth/auth";
import { PageHeader } from "@/shared/components/PageHeader";

/** Renders the tenant dashboard. */
export default async function DashboardPage() {
  const session = await auth();
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader title="Dashboard" subtitle={`Welcome${session?.user.name ? `, ${session.user.name}` : ""}`} />
      <Paper sx={{ p: 3 }}>
        <Stack spacing={1}>
          <Typography variant="h6">CRM dashboard</Typography>
          <Typography color="text.secondary">Manage customers, contacts, and leads from one workspace.</Typography>
        </Stack>
      </Paper>
    </Container>
  );
}
