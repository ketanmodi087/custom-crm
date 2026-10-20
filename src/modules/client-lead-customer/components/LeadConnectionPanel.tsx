"use client";

import * as React from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import NextLink from "next/link";
import type { CustomerOption, LeadConnection } from "../types";

type LeadConnectionPanelProps = {
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    companyName: string | null;
    status: "NEW" | "CONTACTED" | "QUALIFIED" | "LOST";
  };
  initialConnection: LeadConnection;
  customerOptions: CustomerOption[];
  canLink: boolean;
  canConvert: boolean;
};

async function readApiError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as
    | { error?: { message?: string } }
    | null;
  return body?.error?.message ?? "The request could not be completed.";
}

const formatUtcDateTime = (isoValue: string): string => {
  const [date, time = ""] = isoValue.split("T");
  return `${date} ${time.slice(0, 5)} UTC`;
};

/** Manages existing links and qualified Lead conversion to Customer/Contact master data. */
export function LeadConnectionPanel({
  lead,
  initialConnection,
  customerOptions,
  canLink,
  canConvert,
}: LeadConnectionPanelProps) {
  const [connection, setConnection] = React.useState(initialConnection);
  const [linkOpen, setLinkOpen] = React.useState(false);
  const [convertOpen, setConvertOpen] = React.useState(false);
  const [customerId, setCustomerId] = React.useState(initialConnection.customerId ?? "");
  const [contactId, setContactId] = React.useState(initialConnection.contactId ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const selectedCustomer = customerOptions.find((customer) => customer.id === customerId);
  const isConnected = Boolean(connection.customerId);
  const isConverted = Boolean(connection.convertedAt);

  const saveLink = async () => {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/leads/${lead.id}/customer-link`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: customerId || null,
        contactId: customerId && contactId ? contactId : null,
      }),
    });
    if (response.ok) {
      setConnection((await response.json()) as LeadConnection);
      setLinkOpen(false);
    } else {
      setError(await readApiError(response));
    }
    setBusy(false);
  };

  const disconnect = async () => {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/leads/${lead.id}/customer-link`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: null, contactId: null }),
    });
    if (response.ok) {
      setConnection((await response.json()) as LeadConnection);
      setCustomerId("");
      setContactId("");
    } else {
      setError(await readApiError(response));
    }
    setBusy(false);
  };

  const convert = async () => {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/leads/${lead.id}/convert-to-customer`, { method: "POST" });
    if (response.ok) {
      const converted = (await response.json()) as LeadConnection;
      setConnection(converted);
      setCustomerId(converted.customerId ?? "");
      setContactId(converted.contactId ?? "");
      setConvertOpen(false);
    } else {
      setError(await readApiError(response));
      setConvertOpen(false);
    }
    setBusy(false);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
          }}
        >
          <div>
            <Typography variant="h6">Customer connection</Typography>
            <Typography variant="body2" color="text.secondary">
              Link this Lead to existing master data or create it from a qualified Lead.
            </Typography>
          </div>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {canLink && !isConverted && (
              <Button variant="outlined" startIcon={<LinkIcon />} onClick={() => setLinkOpen(true)}>
                {isConnected ? "Change link" : "Link existing"}
              </Button>
            )}
            {canConvert && !isConnected && lead.status === "QUALIFIED" && (
              <Button
                variant="contained"
                startIcon={<PersonAddAltIcon />}
                onClick={() => setConvertOpen(true)}
              >
                Convert to customer
              </Button>
            )}
          </Stack>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}
        {isConnected ? (
          <Stack spacing={0.5}>
            <Typography>
              Customer:{" "}
              <Link component={NextLink} href={`/customers/${connection.customerId}`}>
                {connection.customerName}
              </Link>
            </Typography>
            <Typography>Contact: {connection.contactName || "No contact selected"}</Typography>
            {isConverted && (
              <Typography variant="caption" color="text.secondary">
                Converted {formatUtcDateTime(connection.convertedAt as string)}
              </Typography>
            )}
            {canLink && !isConverted && (
              <Button
                color="error"
                size="small"
                onClick={() => void disconnect()}
                disabled={busy}
                sx={{ alignSelf: "flex-start", mt: 1 }}
              >
                Disconnect
              </Button>
            )}
          </Stack>
        ) : (
          <Alert severity={lead.status === "QUALIFIED" ? "info" : "warning"}>
            {lead.status === "QUALIFIED"
              ? "This qualified Lead is ready to link or convert."
              : "Set the Lead status to Qualified before creating new customer master data."}
          </Alert>
        )}
      </Stack>

      <Dialog open={linkOpen} onClose={busy ? undefined : () => setLinkOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Link existing customer</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Customer"
              select
              value={customerId}
              onChange={(event) => {
                setCustomerId(event.target.value);
                setContactId("");
              }}
              fullWidth
            >
              <MenuItem value="">Select a customer</MenuItem>
              {customerOptions.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>{customer.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Contact"
              select
              value={contactId}
              onChange={(event) => setContactId(event.target.value)}
              disabled={!customerId}
              fullWidth
            >
              <MenuItem value="">No contact</MenuItem>
              {(selectedCustomer?.contacts ?? []).map((contact) => (
                <MenuItem key={contact.id} value={contact.id}>
                  {contact.firstName} {contact.lastName}{contact.email ? ` — ${contact.email}` : ""}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkOpen(false)} disabled={busy}>Cancel</Button>
          <Button variant="contained" onClick={() => void saveLink()} disabled={busy || !customerId}>
            {busy ? "Saving…" : "Save link"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={convertOpen} onClose={busy ? undefined : () => setConvertOpen(false)}>
        <DialogTitle>Convert Lead to customer?</DialogTitle>
        <DialogContent>
          A new Customer named “{lead.companyName || `${lead.firstName} ${lead.lastName}`}” and a
          Contact for {lead.firstName} {lead.lastName} will be created and permanently linked.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertOpen(false)} disabled={busy}>Cancel</Button>
          <Button variant="contained" onClick={() => void convert()} disabled={busy}>
            {busy ? "Converting…" : "Convert"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
