# Lead Customer Integration

## Purpose

This client-only module connects the standalone Leads module with Customer/Contact master data.
It owns the cross-module workflow and imports neither business module.

## Flows

- Link or unlink an unconverted Lead to an existing active Customer and optional Contact.
- Convert a qualified, unconnected Lead into a new Customer and Contact atomically.
- Show related active Leads on a Customer profile.
- Block Customer or Contact deletion while an active Lead references the record.

## Business rules

Conversion requires `QUALIFIED` status, is idempotently claimed, and audits the Customer,
Contact, and Lead changes in the same transaction. All identifiers are resolved with the
server-session tenant ID. A Contact must belong to the selected Customer.

## Permissions

Linking requires `leads.write` and `customers.read`. Conversion requires `leads.write` and
`customers.write`. Deletion continues to require `customers.delete`.

## Removal

Remove this folder, its route handlers and detail-page composition, the integration manifest,
and the optional Lead relation columns. The underlying Customers and Leads modules remain
independent.
