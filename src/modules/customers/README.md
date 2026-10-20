# Customers Module

## Purpose

This module owns tenant-isolated customer master data and the people associated with each
customer. It can be removed without changing the Leads module.

## Main flows

Users with `customers.read` can search and filter active customers and view their contacts.
Users with `customers.write` can create and edit customers and contacts. Users with
`customers.delete` can soft-delete either record type. Every mutation writes an audit entry in
the same database transaction.

## Public services

- `listCustomers(tenantId, query)` lists active customers.
- `getCustomer(tenantId, id)` returns an active customer and active contacts.
- `createCustomer` and `updateCustomer` mutate customer records.
- `createContact` and `updateContact` mutate contacts beneath a verified tenant-owned customer.
- Deletion is composed through `client-lead-customer`, which blocks deletion while an active Lead
  references the Customer or Contact.

## Configuration and permissions

Register `customersModule` in `src/config/modules.ts`. Seed `customers.read`,
`customers.write`, and `customers.delete`, then sign out and back in so the JWT contains the
new grants.

## Extension points and limitations

Client-specific links to Leads or later sales modules must use adapters or client-only modules;
this module never imports another business module. This version intentionally excludes imports,
exports, custom fields, duplicate detection, contact roles, and conversion workflows.
