"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import NextLink from "next/link";
import { PageHeader } from "@/shared/components/PageHeader";
import {
  LEAD_STATUSES,
  leadInputSchema,
  type LeadInput,
  type LeadItem,
  type LeadListResult,
  type LeadStatus,
} from "../types";

type LeadsClientProps = {
  initialResult: LeadListResult;
  canWrite: boolean;
  canDelete: boolean;
};

type LeadFormDialogProps = {
  lead: LeadItem | null;
  onClose: () => void;
  onSaved: (lead: LeadItem) => void;
};

const statusLabels: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  LOST: "Lost",
};

const getFormDefaults = (lead: LeadItem | null): LeadInput => ({
  firstName: lead?.firstName ?? "",
  lastName: lead?.lastName ?? "",
  companyName: lead?.companyName ?? "",
  email: lead?.email ?? "",
  phone: lead?.phone ?? "",
  status: lead?.status ?? "NEW",
  notes: lead?.notes ?? "",
});

async function readApiError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as
    | { error?: { message?: string } }
    | null;
  return body?.error?.message ?? "The request could not be completed.";
}

/** Displays and submits the create/edit Lead form. */
function LeadFormDialog({ lead, onClose, onSaved }: LeadFormDialogProps) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadInput>({
    resolver: zodResolver(leadInputSchema),
    defaultValues: getFormDefaults(lead),
  });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    const response = await fetch(lead ? `/api/leads/${lead.id}` : "/api/leads", {
      method: lead ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      setServerError(await readApiError(response));
      return;
    }
    onSaved((await response.json()) as LeadItem);
  });

  return (
    <Dialog open onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={submit}>
        <DialogTitle>{lead ? "Edit lead" : "Add lead"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="First name" error={Boolean(errors.firstName)} helperText={errors.firstName?.message} fullWidth />
                )}
              />
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Last name" error={Boolean(errors.lastName)} helperText={errors.lastName?.message} fullWidth />
                )}
              />
            </Stack>
            <Controller name="companyName" control={control} render={({ field }) => <TextField {...field} label="Company" fullWidth />} />
            <Controller
              name="email"
              control={control}
              render={({ field }) => <TextField {...field} label="Email" type="email" error={Boolean(errors.email)} helperText={errors.email?.message} fullWidth />}
            />
            <Controller name="phone" control={control} render={({ field }) => <TextField {...field} label="Phone" fullWidth />} />
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Status" select fullWidth>
                  {LEAD_STATUSES.map((status) => <MenuItem key={status} value={status}>{statusLabels[status]}</MenuItem>)}
                </TextField>
              )}
            />
            <Controller name="notes" control={control} render={({ field }) => <TextField {...field} label="Notes" multiline minRows={3} fullWidth />} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

/** Provides search, pagination, and permission-aware Lead CRUD interactions. */
export function LeadsClient({ initialResult, canWrite, canDelete }: LeadsClientProps) {
  const [result, setResult] = React.useState(initialResult);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<LeadStatus | "">("");
  const [editing, setEditing] = React.useState<LeadItem | null | undefined>(undefined);
  const [deleting, setDeleting] = React.useState<LeadItem | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = async (page = 1, pageSize = result.pageSize) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ q: query, page: String(page), pageSize: String(pageSize) });
    if (status) params.set("status", status);
    const response = await fetch(`/api/leads?${params.toString()}`);
    if (response.ok) setResult((await response.json()) as LeadListResult);
    else setError(await readApiError(response));
    setLoading(false);
  };

  const handleSaved = (lead: LeadItem) => {
    setEditing(undefined);
    setResult((current) => {
      const exists = current.data.some((item) => item.id === lead.id);
      return {
        ...current,
        total: exists ? current.total : current.total + 1,
        data: exists
          ? current.data.map((item) => (item.id === lead.id ? lead : item))
          : [lead, ...current.data].slice(0, current.pageSize),
      };
    });
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setLoading(true);
    const response = await fetch(`/api/leads/${deleting.id}`, { method: "DELETE" });
    if (response.ok) {
      setResult((current) => ({
        ...current,
        total: Math.max(0, current.total - 1),
        data: current.data.filter((item) => item.id !== deleting.id),
      }));
      setDeleting(null);
    } else {
      setError(await readApiError(response));
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader
        title="Leads"
        subtitle="A focused list of prospective customers."
        actions={canWrite ? <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing(null)}>Add lead</Button> : undefined}
      />
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
          <TextField label="Search" value={query} onChange={(event) => setQuery(event.target.value)} size="small" fullWidth />
          <TextField label="Status" value={status} onChange={(event) => setStatus(event.target.value as LeadStatus | "")} select size="small" sx={{ minWidth: 180 }}>
            <MenuItem value="">All statuses</MenuItem>
            {LEAD_STATUSES.map((item) => <MenuItem key={item} value={item}>{statusLabels[item]}</MenuItem>)}
          </TextField>
          <Button variant="outlined" startIcon={<SearchIcon />} onClick={() => void load(1)} disabled={loading}>Search</Button>
        </Stack>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TableContainer>
          <Table>
            <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Company</TableCell><TableCell>Contact</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
            <TableBody>
              {result.data.map((lead) => (
                <TableRow key={lead.id} hover>
                  <TableCell><Typography sx={{ fontWeight: 600 }}>{lead.firstName} {lead.lastName}</Typography></TableCell>
                  <TableCell>{lead.companyName || "—"}</TableCell>
                  <TableCell>{lead.email || lead.phone || "—"}</TableCell>
                  <TableCell><Chip label={statusLabels[lead.status]} size="small" /></TableCell>
                  <TableCell align="right">
                    <Tooltip title="View and connect">
                      <IconButton component={NextLink} href={`/leads/${lead.id}`} aria-label="View lead">
                        <VisibilityOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                    {canWrite && <Tooltip title="Edit"><IconButton aria-label="Edit lead" onClick={() => setEditing(lead)}><EditOutlinedIcon /></IconButton></Tooltip>}
                    {canDelete && <Tooltip title="Delete"><IconButton aria-label="Delete lead" color="error" onClick={() => setDeleting(lead)}><DeleteOutlineIcon /></IconButton></Tooltip>}
                  </TableCell>
                </TableRow>
              ))}
              {!loading && result.data.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}>No leads found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
        {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}><CircularProgress size={24} /></Box>}
        <TablePagination
          component="div"
          count={result.total}
          page={result.page - 1}
          rowsPerPage={result.pageSize}
          onPageChange={(_event, page) => void load(page + 1)}
          onRowsPerPageChange={(event) => void load(1, Number(event.target.value))}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </Paper>

      {editing !== undefined && <LeadFormDialog key={editing?.id ?? "new"} lead={editing} onClose={() => setEditing(undefined)} onSaved={handleSaved} />}
      <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)}>
        <DialogTitle>Delete lead?</DialogTitle>
        <DialogContent>This removes the lead from active lists. The audit record is retained.</DialogContent>
        <DialogActions><Button onClick={() => setDeleting(null)}>Cancel</Button><Button color="error" variant="contained" onClick={() => void confirmDelete()} disabled={loading}>Delete</Button></DialogActions>
      </Dialog>
    </Container>
  );
}
