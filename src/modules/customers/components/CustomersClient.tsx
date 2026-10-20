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
  CUSTOMER_STATUSES,
  customerInputSchema,
  type CustomerInput,
  type CustomerItem,
  type CustomerListResult,
  type CustomerStatus,
} from "../types";

type CustomersClientProps = {
  initialResult: CustomerListResult;
  canWrite: boolean;
  canDelete: boolean;
};

type CustomerFormDialogProps = {
  customer: CustomerItem | null;
  onClose: () => void;
  onSaved: (customer: CustomerItem) => void;
};

const statusLabels: Record<CustomerStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

const getFormDefaults = (customer: CustomerItem | null): CustomerInput => ({
  name: customer?.name ?? "",
  email: customer?.email ?? "",
  phone: customer?.phone ?? "",
  website: customer?.website ?? "",
  address: customer?.address ?? "",
  status: customer?.status ?? "ACTIVE",
  notes: customer?.notes ?? "",
});

async function readApiError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as
    | { error?: { message?: string } }
    | null;
  return body?.error?.message ?? "The request could not be completed.";
}

function CustomerFormDialog({ customer, onClose, onSaved }: CustomerFormDialogProps) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerInputSchema),
    defaultValues: getFormDefaults(customer),
  });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    const response = await fetch(customer ? `/api/customers/${customer.id}` : "/api/customers", {
      method: customer ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      setServerError(await readApiError(response));
      return;
    }
    onSaved((await response.json()) as CustomerItem);
  });

  return (
    <Dialog open onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={submit}>
        <DialogTitle>{customer ? "Edit customer" : "Add customer"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Customer name"
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                  fullWidth
                />
              )}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    type="email"
                    error={Boolean(errors.email)}
                    helperText={errors.email?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="phone"
                control={control}
                render={({ field }) => <TextField {...field} label="Phone" fullWidth />}
              />
            </Stack>
            <Controller
              name="website"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Website"
                  placeholder="https://example.com"
                  error={Boolean(errors.website)}
                  helperText={errors.website?.message}
                  fullWidth
                />
              )}
            />
            <Controller
              name="address"
              control={control}
              render={({ field }) => <TextField {...field} label="Address" multiline minRows={2} fullWidth />}
            />
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Status" select fullWidth>
                  {CUSTOMER_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>{statusLabels[status]}</MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name="notes"
              control={control}
              render={({ field }) => <TextField {...field} label="Notes" multiline minRows={3} fullWidth />}
            />
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

/** Provides search, pagination, and permission-aware customer CRUD interactions. */
export function CustomersClient({ initialResult, canWrite, canDelete }: CustomersClientProps) {
  const [result, setResult] = React.useState(initialResult);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<CustomerStatus | "">("");
  const [editing, setEditing] = React.useState<CustomerItem | null | undefined>(undefined);
  const [deleting, setDeleting] = React.useState<CustomerItem | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = async (page = 1, pageSize = result.pageSize) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ q: query, page: String(page), pageSize: String(pageSize) });
    if (status) params.set("status", status);
    const response = await fetch(`/api/customers?${params.toString()}`);
    if (response.ok) setResult((await response.json()) as CustomerListResult);
    else setError(await readApiError(response));
    setLoading(false);
  };

  const handleSaved = (customer: CustomerItem) => {
    setEditing(undefined);
    setResult((current) => {
      const exists = current.data.some((item) => item.id === customer.id);
      return {
        ...current,
        total: exists ? current.total : current.total + 1,
        data: exists
          ? current.data.map((item) =>
              item.id === customer.id
                ? { ...customer, contactCount: item.contactCount }
                : item,
            )
          : [customer, ...current.data].slice(0, current.pageSize),
      };
    });
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setLoading(true);
    const response = await fetch(`/api/customers/${deleting.id}`, { method: "DELETE" });
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
        title="Customers"
        subtitle="Manage customer organizations and their contacts."
        actions={canWrite ? (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing(null)}>
            Add customer
          </Button>
        ) : undefined}
      />
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value as CustomerStatus | "")}
            select
            size="small"
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All statuses</MenuItem>
            {CUSTOMER_STATUSES.map((item) => (
              <MenuItem key={item} value={item}>{statusLabels[item]}</MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            onClick={() => void load(1)}
            disabled={loading}
          >
            Search
          </Button>
        </Stack>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Contacts</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.data.map((customer) => (
                <TableRow key={customer.id} hover>
                  <TableCell><Typography sx={{ fontWeight: 600 }}>{customer.name}</Typography></TableCell>
                  <TableCell>{customer.email || customer.phone || "—"}</TableCell>
                  <TableCell>{customer.contactCount}</TableCell>
                  <TableCell>
                    <Chip
                      label={statusLabels[customer.status]}
                      size="small"
                      color={customer.status === "ACTIVE" ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View contacts">
                      <IconButton
                        component={NextLink}
                        href={`/customers/${customer.id}`}
                        aria-label={`View ${customer.name}`}
                      >
                        <VisibilityOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                    {canWrite && (
                      <Tooltip title="Edit">
                        <IconButton aria-label="Edit customer" onClick={() => setEditing(customer)}>
                          <EditOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canDelete && (
                      <Tooltip title="Delete">
                        <IconButton
                          aria-label="Delete customer"
                          color="error"
                          onClick={() => setDeleting(customer)}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!loading && result.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>No customers found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
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

      {editing !== undefined && (
        <CustomerFormDialog
          key={editing?.id ?? "new"}
          customer={editing}
          onClose={() => setEditing(undefined)}
          onSaved={handleSaved}
        />
      )}
      <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)}>
        <DialogTitle>Delete customer?</DialogTitle>
        <DialogContent>
          This removes the customer and hides its contacts from active lists. Audit records are retained.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void confirmDelete()}
            disabled={loading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
