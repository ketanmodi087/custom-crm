import {
  Chip,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import NextLink from "next/link";
import type { RelatedLeadItem } from "../types";

type CustomerRelatedLeadsProps = { leads: RelatedLeadItem[] };

const statusLabels: Record<RelatedLeadItem["status"], string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  LOST: "Lost",
};

/** Displays active Leads connected to a Customer without coupling the Customers module to Leads. */
export function CustomerRelatedLeads({ leads }: CustomerRelatedLeadsProps) {
  return (
    <Paper sx={{ p: 2, mt: 3 }}>
      <Typography variant="h6" sx={{ px: 1, py: 1 }}>Related leads</Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Lead</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Connection</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id} hover>
                <TableCell>
                  <Link component={NextLink} href={`/leads/${lead.id}`} underline="hover">
                    {lead.firstName} {lead.lastName}
                  </Link>
                </TableCell>
                <TableCell><Chip size="small" label={statusLabels[lead.status]} /></TableCell>
                <TableCell>{lead.convertedAt ? "Converted" : "Linked"}</TableCell>
              </TableRow>
            ))}
            {leads.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>No active leads are connected.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
