import { Box, Chip, Container, Paper, Stack, Typography } from "@mui/material";
import { PageHeader } from "@/shared/components/PageHeader";
import type { LeadItem, LeadStatus } from "../types";

type LeadDetailSummaryProps = {
  lead: LeadItem;
  integrationContent?: React.ReactNode;
};

const statusLabels: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  LOST: "Lost",
};

/** Displays a Lead summary and an optional client-specific integration panel. */
export function LeadDetailSummary({ lead, integrationContent }: LeadDetailSummaryProps) {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader
        title={`${lead.firstName} ${lead.lastName}`}
        subtitle={lead.companyName || "Lead profile"}
        breadcrumbs={[{ label: "Leads", href: "/leads" }, { label: `${lead.firstName} ${lead.lastName}` }]}
      />
      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={4}>
            <Box sx={{ minWidth: 180 }}>
              <Typography variant="caption" color="text.secondary">Status</Typography>
              <Box sx={{ mt: 0.5 }}><Chip label={statusLabels[lead.status]} size="small" /></Box>
            </Box>
            <Box sx={{ minWidth: 220 }}>
              <Typography variant="caption" color="text.secondary">Email</Typography>
              <Typography>{lead.email || "—"}</Typography>
            </Box>
            <Box sx={{ minWidth: 180 }}>
              <Typography variant="caption" color="text.secondary">Phone</Typography>
              <Typography>{lead.phone || "—"}</Typography>
            </Box>
          </Stack>
          {lead.notes && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="caption" color="text.secondary">Notes</Typography>
              <Typography sx={{ whiteSpace: "pre-wrap" }}>{lead.notes}</Typography>
            </Box>
          )}
        </Paper>
        {integrationContent}
      </Stack>
    </Container>
  );
}
