# Leads Module

## Purpose

This module provides tenant-isolated Lead CRUD without configurable pipelines,
custom fields, activities, scoring, hierarchy assignment, or conversion workflows.

## Main flow

Authenticated users with `leads.read` can search and filter active leads. Users with
`leads.write` can create and edit them. Users with `leads.delete` can soft-delete them.
Every mutation writes a backend audit entry in the same database transaction.

In this client profile, the manifest declares Customers as a base dependency. Cross-module
linking and conversion remain outside this module in `client-lead-customer`.

## Public services

- `listLeads(tenantId, query)` lists active tenant-owned leads.
- `createLead(tenantId, actorId, input)` creates and audits a lead.
- `updateLead(tenantId, id, actorId, input)` verifies ownership, updates, and audits.
- `deleteLead(tenantId, id, actorId)` verifies ownership, soft-deletes, and audits.

## Extension points and limitations

Add client-specific behavior through adapters or a client-only module. This edition intentionally
does not include hierarchy scope, configurable stages, custom fields, activities, restore UI,
imports, exports, conversions, or reports.
