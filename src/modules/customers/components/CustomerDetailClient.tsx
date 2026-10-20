"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { PageHeader } from "@/shared/components/PageHeader";
import {
  contactInputSchema,
  type ContactInput,
  type ContactItem,
  type CustomerDetail,
} from "../types";

type CustomerDetailClientProps = {
  initialCustomer: CustomerDetail;
  canWrite: boolean;
  canDelete: boolean;
  relatedContent?: React.ReactNode;
};

type ContactFormDialogProps = {
  customerId: string;
  contact: ContactItem | null;
  onClose: () => void;
  onSaved: (contact: ContactItem) => void;
};

const getFormDefaults = (contact: ContactItem | null): ContactInput => ({
  firstName: contact?.firstName ?? "",
  lastName: contact?.lastName ?? "",
  jobTitle: contact?.jobTitle ?? "",
  email: contact?.email ?? "",
  phone: contact?.phone ?? "",
  notes: contact?.notes ?? "",
});

async function readApiError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as
    | { error?: { message?: string } }
    | null;
  return body?.error?.message ?? "The request could not be completed.";
}

function ContactFormDialog({ customerId, contact, onClose, onSaved }: ContactFormDialogProps) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactInputSchema),
    defaultValues: getFormDefaults(contact),
  });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    const baseUrl = `/api/customers/${customerId}/contacts`;
    const response = await fetch(contact ? `${baseUrl}/${contact.id}` : baseUrl, {
      method: contact ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      setServerError(await readApiError(response));
      return;
    }
    onSaved((await response.json()) as ContactItem);
  });

  return (
    <Dialog open onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={submit}>
        <DialogTitle>{contact ? "Edit contact" : "Add contact"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="First name"
                    error={Boolean(errors.firstName)}
                    helperText={errors.firstName?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Last name"
                    error={Boolean(errors.lastName)}
                    helperText={errors.lastName?.message}
                    fullWidth
                  />
                )}
              />
            </Stack>
            <Controller
              name="jobTitle"
              control={control}
              render={({ field }) => <TextField {...field} label="Job title" fullWidth />}
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

/** Displays one customer and manages its tenant-owned contacts. */
export function CustomerDetailClient({
  initialCustomer,
  canWrite,
  canDelete,
  relatedContent,
}: CustomerDetailClientProps) {
  const [contacts, setContacts] = React.useState(initialCustomer.contacts);
  const [editing, setEditing] = React.useState<ContactItem | null | undefined>(undefined);
  const [deleting, setDeleting] = React.useState<ContactItem | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSaved = (contact: ContactItem) => {
    setEditing(undefined);
    setContacts((current) => {
      const exists = current.some((item) => item.id === contact.id);
      return exists
        ? current.map((item) => (item.id === contact.id ? contact : item))
        : [...current, contact].sort((left, right) =>
            `${left.lastName} ${left.firstName}`.localeCompare(`${right.lastName} ${right.firstName}`),
          );
    });
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    setError(null);
    const response = await fetch(
      `/api/customers/${initialCustomer.id}/contacts/${deleting.id}`,
      { method: "DELETE" },
    );
    if (response.ok) {
      setContacts((current) => current.filter((item) => item.id !== deleting.id));
      setDeleting(null);
    } else {
      setError(await readApiError(response));
    }
    setBusy(false);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader
        title={initialCustomer.name}
        subtitle="Customer profile and contacts"
        breadcrumbs={[{ label: "Customers", href: "/customers" }, { label: initialCustomer.name }]}
        actions={canWrite ? (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing(null)}>
            Add contact
          </Button>
        ) : undefined}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={4}>
          <Box sx={{ minWidth: 220 }}>
            <Typography variant="caption" color="text.secondary">Status</Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip
                label={initialCustomer.status === "ACTIVE" ? "Active" : "Inactive"}
                size="small"
                color={initialCustomer.status === "ACTIVE" ? "success" : "default"}
              />
            </Box>
          </Box>
          <Box sx={{ minWidth: 220 }}>
            <Typography variant="caption" color="text.secondary">Email</Typography>
            <Typography>
              {initialCustomer.email ? (
                <Link href={`mailto:${initialCustomer.email}`}>{initialCustomer.email}</Link>
              ) : "—"}
            </Typography>
          </Box>
          <Box sx={{ minWidth: 180 }}>
            <Typography variant="caption" color="text.secondary">Phone</Typography>
            <Typography>{initialCustomer.phone || "—"}</Typography>
          </Box>
          <Box sx={{ minWidth: 220 }}>
            <Typography variant="caption" color="text.secondary">Website</Typography>
            <Typography>
              {initialCustomer.website ? (
                <Link href={initialCustomer.website} target="_blank" rel="noreferrer">
                  {initialCustomer.website}
                </Link>
              ) : "—"}
            </Typography>
          </Box>
        </Stack>
        {(initialCustomer.address || initialCustomer.notes) && (
          <Stack spacing={2} sx={{ mt: 3 }}>
            {initialCustomer.address && (
              <Box>
                <Typography variant="caption" color="text.secondary">Address</Typography>
                <Typography sx={{ whiteSpace: "pre-wrap" }}>{initialCustomer.address}</Typography>
              </Box>
            )}
            {initialCustomer.notes && (
              <Box>
                <Typography variant="caption" color="text.secondary">Notes</Typography>
                <Typography sx={{ whiteSpace: "pre-wrap" }}>{initialCustomer.notes}</Typography>
              </Box>
            )}
          </Stack>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ px: 1, py: 1 }}>Contacts</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Job title</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>
                      {contact.firstName} {contact.lastName}
                    </Typography>
                  </TableCell>
                  <TableCell>{contact.jobTitle || "—"}</TableCell>
                  <TableCell>
                    {contact.email ? <Link href={`mailto:${contact.email}`}>{contact.email}</Link> : "—"}
                  </TableCell>
                  <TableCell>{contact.phone || "—"}</TableCell>
                  <TableCell align="right">
                    {canWrite && (
                      <Tooltip title="Edit">
                        <IconButton aria-label="Edit contact" onClick={() => setEditing(contact)}>
                          <EditOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canDelete && (
                      <Tooltip title="Delete">
                        <IconButton
                          aria-label="Delete contact"
                          color="error"
                          onClick={() => setDeleting(contact)}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {contacts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    No contacts have been added.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      {relatedContent}

      {editing !== undefined && (
        <ContactFormDialog
          key={editing?.id ?? "new"}
          customerId={initialCustomer.id}
          contact={editing}
          onClose={() => setEditing(undefined)}
          onSaved={handleSaved}
        />
      )}
      <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)}>
        <DialogTitle>Delete contact?</DialogTitle>
        <DialogContent>
          This removes the contact from active lists. The audit record is retained.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void confirmDelete()}
            disabled={busy}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
