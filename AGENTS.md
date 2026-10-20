# AGENTS.md — Kanhasoft Internal CRM/ERP Accelerator

## Minimal client-copy override

This directory is the approved minimal client copy described by
`plans/07-minimal-client-profile.md`. That higher-numbered plan supersedes requirements to keep
the Platform, Hierarchy, Identity UI, Inquiries, advanced Leads, Products/Pricing, Quotations,
MFA, and active-session modules in this copy. Do not reintroduce them unless plan 07 is explicitly
superseded. The locked stack, tenant isolation, permission checks, layering, audit logging, and
documentation requirements below still apply.

Read this file fully before writing or changing any code. It is the single source of
truth for all AI coding agents (Cursor, Antigravity, Claude Code, others).

## 1. What this project is

A **reusable CRM + ERP accelerator**, not a single-client app. Modules built here are
reused in future client projects, so the goal is ~30–40% of every new client project
already done: **clean, configurable, documented, safe to extend without rewriting.**

Every decision should answer: *"Can a developer who has never seen this code understand,
reuse and extend it in a new client project?"*

**Delivery model (see Section 8):** this repo is a boilerplate. For each client, developers
make a separate copy with its own database and domain, keep only the modules that client needs,
and build any extra features in that copy.

## 2. Locked stack (do not change without approval)

Decided in `/plans/01-crm-boilerplate-base.md`:

- Next.js (App Router, `src/`; the build output indicates Next.js 16), TypeScript strict,
  Route Handlers for the API
- MUI + Emotion (`AppRouterCacheProvider`)
- PostgreSQL + Prisma
- Auth.js v5 (Credentials) with JWT session
- Zod + React Hook Form + MUI field wrappers
- Modular monolith: one deployable app, many isolated modules

Do not swap, replace or add a competing library for any of the above.

Developer environment: Windows with PowerShell. Give commands that work in PowerShell.
Next.js prints deprecation warnings to stderr, and PowerShell can report that as a failed
command. A warning is not a failure: check the real result of the build.

## 3. Plans are the source of truth

All plans and decisions live in `/plans` (numbered Markdown files) and `/plans/decisions/`.

1. **Read `/plans/README.md` (index) first, then every plan relevant to your task.**
2. Follow plans with status Approved or In progress. Do not implement a Draft plan.
3. If plans conflict, the **higher-numbered plan wins** (later decisions supersede earlier
   ones). Example: plan 03 (schema-per-tenant) is Superseded by the single-schema decision
   in Section 6; global unique email is kept.
   If you find a conflict you cannot resolve, stop and ask.
4. Never contradict a plan silently. If code must differ from a plan, say so and propose
   a plan update.
5. After finishing a task, update the plan's status and add a short "Result" note.
6. Never delete old plans. Mark them `Superseded by NN`.
7. Save discussion outcomes as: decisions made, options rejected and why. Not full chat logs.

## 4. Before you write any code

1. Read the relevant plans and the module's `README.md`.
2. Inspect existing code for conventions (auth, tenant access, errors, validation) and reuse
   them. Do not create a second way of doing the same thing.
3. Search for an existing utility, component or service first.
4. For anything bigger than a small fix, write a short plan (files changed, what is added,
   what could break) and wait for approval.
5. If a requirement is unclear or conflicts with these rules, ask. Do not guess on
   tenancy, security, workflow or data-model decisions.
6. Need a new library? Follow **Section 15** first.
7. This file names helpers and docs that may not exist yet (`withAuth`, `getAccessScope`,
   the module registry, `modules/_template`, shared CRM kit components, files under `docs/`).
   **Check that they exist before using them.** If one does not exist, say so and ask before
   creating it. Never create a second version of something that already exists.
   Confirmed missing by the repository audit (October 2026): module `README.md` files,
   `/plans/decisions/`, `tests/` folders, `src/core/env.ts`, `FormDialog`, `TableToolbar`,
   `FilterBar`, React Hook Form field wrappers, and most core building blocks in Section 16.
   Existing modules: `hierarchy`, `identity`, `platform`. A copy of this file inside
   `node_modules` is not part of the project; ignore it.

## 5. Architecture and folder structure

```
src/
  app/            routes and API route handlers only (thin)
  core/           auth, db, env, theme, layout, module-registry, api helpers
  shared/         CRM UI kit, hooks, types, utils (no business rules)
  modules/        independent feature modules; start from modules/_template
  config/         modules.ts (enable/disable modules), adapters.ts
docs/             ADDING_A_MODULE.md, CLIENT_CLONE.md, MODULE_INDEPENDENCE.md,
                  HIERARCHY_RULES.md
plans/            plans and decisions
```

**Hard rules**
- **Module A never imports Module B.** Shared code lives only in `src/core` or `src/shared`.
- Cross-module links use optional **adapters** in `config/adapters.ts`, or generic
  registration through the module registry. Never a direct import.
- Enabling a module = Prisma models in the root schema + entry in `config/modules.ts` +
  thin routes in `app/` + permission registration in `src/core/rbac/permissions.ts` + `npm run db:seed`.
- Each module follows `modules/_template`. Every module has a `README.md`.
- Every module declares a `ModuleDefinition` (id, name, nav items, permissions). Navigation
  comes only from enabled modules and filters items based on `session.user.permissions`.
- **New Module Checklist (Required every time a module is created):**
  1. Add Prisma models to `prisma/schema.prisma` -> run `npm run db:push` & `npm run db:generate`.
  2. Implement module under `src/modules/<module>/` with `index.ts`, `services.ts`, `types.ts`, `components/`, and `README.md`.
  3. Register module in `src/config/modules.ts` (`enabledModules`).
  4. Register module's permissions in `src/core/rbac/permissions.ts` under `PERMISSION_MODULES` (`actions: ["read", "write", "delete"]`).
  5. Run `npm run db:seed` so new permissions are inserted into `prisma.permission` and automatically assigned to the `Tenant Admin` role.
  6. **Re-login required in browser**: NextAuth bakes permissions into the JWT session upon login. Developers and users must log out and log back in to refresh their session token and see the newly permitted sidebar menu items.
- **Modules must be removable.** Removal is done in a client's copy, never in the main boilerplate. Removing a module means deleting its folder, its entry in
  `config/modules.ts`, its Prisma models, routes and permissions, and nothing else may break.
  Hidden-but-present modules are not acceptable (live routes and APIs would remain).
- Each module has a manifest: id, nav items, routes, permissions, Prisma models, seed data,
  and `dependsOn` (base modules it needs).
- Only the root `prisma/schema.prisma` is applied. `schema.fragment.prisma` files inside
  modules are documentation.

## 6. Multi-tenancy and database (single schema)

Decision: **all data lives in the `public` schema** (authentication, configuration, hierarchy
and CRM business data). There are no per-tenant schemas. Plan 03 (schema-per-tenant) is
Superseded. Do not reintroduce per-tenant schemas, `withTenantSchema`, schema-name helpers or a
`tenantSchema` session field.

- Each client deployment has its own database and normally one tenant. Production code must
  still be safe if more than one tenant row exists.
- **Every tenant-owned table carries `tenantId`, and every query filters by it.** This is a
  security rule regardless of how many tenants exist.
- `tenantId` comes from the **server-side session**, never from request input. Never trust an
  id from the client without verifying it belongs to the session's tenant (prevent cross-tenant
  IDOR).
- Run Prisma queries only in repositories, and apply the tenant filter there, in one place.
- User email is **globally unique**. Login is email + password only.
- Super Admin creates the tenant record and the first Tenant Admin. Creating a tenant does not
  create schemas or run DDL at runtime.
- Every table has `id`, `createdAt`, `updatedAt`, and where useful `createdById`, `updatedById`,
  and `deletedAt` (soft delete; default queries exclude deleted rows).
- Use transactions for any multi-write operation.
- Schema changes only through Prisma migrations. Never edit the database by hand.
- Database changes in released boilerplate versions must be additive so live client databases
  can upgrade safely. Never rename or drop columns without a migration plan and approval.
- Hierarchy nodes and CRM rows are in the same schema, so use normal foreign keys.
- **Audit logging (required):** every create, update, delete and status change of a business
  record (for example a Quote) must be recorded in `audit_logs`, written in the same
  transaction as the change, through one core audit service. Do not write your own audit
  mechanism. The core service is not built yet: if your task needs it, say so and ask first.
  Details (fields, what is excluded, history screen) are defined in a plan.

## 7. Identity, hierarchy and RBAC

Decided in `/plans/02-saas-hierarchy-rbac.md` (email is globally unique; login is email +
password only):

- Actors: Super Admin (`userType = PLATFORM`) → Tenant → tenant staff and dynamic hierarchy.
- **Super Admin and Tenant Admin are separate roles.** Super Admin creates the tenant and its
  first Tenant Admin. Tenant Admin (`userType = TENANT`) sets up hierarchy levels and nodes,
  roles, users and tenant configuration. Both user types live in the `public` User table.
- Hierarchy is **dynamic per tenant**: ordered `HierarchyLevel` definitions plus generic
  `HierarchyNode` rows. Never create hard-coded Organization/Branch/Team tables.
- Roles are bound to a hierarchy level. A role assignment stores user + role + the specific
  hierarchy node. Permissions are the union of assigned roles; data scope is the assigned
  nodes plus their descendants.
- Business modules get access scope **only** from the core helper
  `getAccessScope(userId)`. They must never reimplement hierarchy or role logic.
- Permission keys follow `module.action` (e.g. `leads.read`) and are registered by the module.
- Hierarchy modules (`platform`, `tenancy`, `hierarchy`, `identity`) never import CRM modules.
- Route protection: `/platform/*` for PLATFORM users only; `/dashboard/*` for TENANT users with a
  valid tenant. Resolve access scope server-side per request, not from a large JWT.
- Existing auth features: email/password login, MFA (`mfaEnabled`, `mfaSecret`, OTP
  verification) and session logging (`UserSession`). Do not change them without approval.
  Treat `mfaSecret`, password hashes and tokens as secrets: never log them or return them in
  API responses. Add tests when you touch this code.
- Next.js is deprecating `middleware` in favour of `proxy`. Renaming it (with the official
  codemod) is a separate planned task. Do not mix it into feature work, and do not create
  new middleware files.
- Structural hierarchy changes after data exists are guarded (see plan 02 and
  `docs/HIERARCHY_RULES.md`).

## 8. Client delivery model and module wiring

**Delivery model**
- This repo is a boilerplate, not a deployed product. Each client gets a **separate copy** of
  the project with its own database, domain and hosting. Each copy has one tenant.
- Each client gets a **separate repository**, not a branch. All client changes (removing
  modules, wiring flows, new features) are made **in the client's copy, never in the main
  boilerplate.**
- Per client: keep only the modules they need, **remove** the others (Section 5), and build
  extra features in that copy.
- Client-specific features live in **client-only modules** (`modules/client-*`) and in config,
  adapters and extension points. Do not edit shared modules or `core` for one client's needs.
  If a fix or improvement is generic, flag it so it can be backported to the boilerplate.
- Boilerplate database changes must be **additive** (new tables/columns, no destructive changes)
  so live client databases can upgrade safely. Releases are tagged and have a changelog.

**Standalone sales modules**
- Inquiry, Lead, Opportunity, Quote and Sales Order are **independent standalone modules**.
  Each works fully on its own: CRUD, statuses, permissions, hierarchy-scoped access, numbering.
- There is **no configurable workflow engine** and no built-in flow between them. Do not build
  one. (The earlier workflow specification is Deferred.)
- Linking between modules is done per client, only in that client's copy, through adapters or
  a client-only module, following `docs/WIRING_MODULES.md`. Modules still never import each other.
- Linking convention (approved): each sales module carries optional `sourceType` and
  `sourceId` fields and exports a function that prepares starting data for the next document
  type. Sales modules also share a set of **common columns** so documents can be converted
  later. The exact list is defined in plan 06; do not invent your own.
- Conversion logic between modules is **not built in the boilerplate yet.** Do not build it
  unless a plan says so.
- When wiring a flow for a client: forward-only order (a later stage never converts back to an
  earlier one), any steps may be skipped, no fake records for skipped steps, conversion in a
  transaction, idempotent (use a row lock inside the transaction to prevent double conversion), the
  conversion recorded in `audit_logs`, and
  Sales Order is the end of the CRM flow.
- Decision: a source document is **not locked or made read-only** after conversion. Later edits
  to it are allowed and are recorded in `audit_logs`. (The row lock above only prevents double
  conversion while the transaction runs.)
- Shared master data (Customers/Contacts, Products/Items) belongs in **base modules** (approved;
  details in plan 05), never inside a sales module, so removing one module never breaks another.

## 9. Code layers and readability

| Layer | Responsibility | Must NOT contain |
|---|---|---|
| Route handler / page | Parse request, auth check, call service, return response | Business logic, direct DB queries |
| Service | Business rules, transactions | UI code, raw HTTP |
| Repository / data access | Prisma queries only | Business decisions |
| Validator (Zod) | Input shape and rules | Database access |
| React components | Display and interaction | Business or workflow rules |

- Clear and boring beats clever. A junior developer must be able to follow it.
- Descriptive names (`convertLeadToQuote`, not `doConv`). No unexplained abbreviations.
- Small single-purpose functions, early returns, no deep nesting.
- No magic numbers or strings. Use constants or enums.
- No dead code, commented-out code or unused imports. No `any` (use `unknown` and narrow).
- Follow existing ESLint and formatting. Do not reformat unrelated code.

## 10. Comments and documentation (required)

Comments explain **why** and the business meaning, not what the syntax does.

- Every exported function, service method and component gets a TSDoc comment: purpose, inputs,
  return value, errors thrown, and any business rule enforced.
- Comment each non-obvious business rule where it is enforced, with the reason.
- Each module has a `README.md`: purpose, main flows, public services, config options, how to
  extend, known limitations. Update it **in the same change** as the code.
- `// TODO(owner): reason` only for real follow-ups. No silent shortcuts.

```ts
/**
 * Converts a Lead into a Quote.
 *
 * Business rule: allowed only if the active workflow version enables
 * LEAD -> QUOTE. The Lead becomes CONVERTED (read-only) afterwards.
 *
 * @throws TransitionNotAllowedError if the transition is not configured
 * @throws ValidationError if required Quote fields are still missing
 */
```

## 11. Reusability and configurability

- Never hard-code client-specific behaviour. Use tenant settings, module config, feature flags.
- Build generic first, then configure. Copy-pasted twice means extract it.
- Labels, statuses, options and workflow paths come from config or constants.
- Each module must be liftable into a new client project with minimal changes. Note any setup
  in its README.

## 12. API, security and errors

- Validate all input on the server. Check authentication, tenant and **permission** on every
  endpoint, using `withAuth` and the standard helpers.
- Never trust IDs or tenant values from the client. Always verify ownership (prevent
  cross-tenant IDOR).
- Use the standard `ApiError` and `PaginatedResult<T>` shapes. Do not invent new ones.
- Never log secrets, tokens or personal data. Never commit `.env` values.
- No raw SQL unless unavoidable, and then always parameterised.

## 13. UI rules

- Use the shared CRM kit (`PageHeader`, `DataTable`, `FilterBar`, `FormDialog`, `ConfirmDialog`,
  `StatusChip`, RHF field wrappers, etc.) and the MUI theme before creating new components.
- **MUI v6 & React 19 Component Conventions (Mandatory):**
  - Always use `slotProps` instead of deprecated `*Props`. For example:
    - Use `CardHeader slotProps={{ title: { variant: "subtitle1", fontWeight: 700 } }}`. **Never use legacy `titleTypographyProps` or `subheaderTypographyProps`** (they pass unrecognized attributes to DOM `<div>` elements and trigger React 19 console errors).
    - Use `TextField slotProps={{ input: { ... }, inputLabel: { shrink: true } }}` instead of `InputProps` / `InputLabelProps`.
  - **Form Dialogs & Lazy Initialization:**
    - When components are conditionally mounted (`{dialogOpen && <FormDialog item={selectedItem} />}`), initialize state with a factory function: `useState(() => getInitialFormData(item))` so that form fields are populated immediately on first render without relying on a subsequent effect.
- No business or workflow decisions in React components.
- Handle loading, empty, error and permission-denied states on every screen.
- Keep components small. Move fetching and logic into hooks or services.

## 14. Testing

- No test framework is set up yet and there are no `tests/` folders. Do not add a test tool
  without following Section 15 and getting approval.
- Add tests for every service rule you add or change, once a test tool is approved.
- For tenancy, always test cross-tenant isolation (tenant A can never see tenant B data).
- For client wiring work, cover each conversion: allowed path, skipped steps, rejected backward
  conversion, double conversion, the audit log entry, and that removed modules do not break the rest.
- Never delete or weaken a test to make a change pass. Fix the cause.
- Run lint, type-check and tests before saying work is done.

## 15. Dependency policy

A bad dependency is copied into every future client project, so be conservative.

**Prefer, in order:** built-in platform features, then a small amount of our own clear code,
then a well-established library. Avoid brand-new or trendy libraries.

**A new library must pass ALL of these before it is proposed:**
- [ ] Actively maintained (recent releases, issues answered, not archived or deprecated)
- [ ] Widely adopted, not a brand-new or single-maintainer project for core functionality
- [ ] Stable semantic versioning, changelog and migration guides, responsible major upgrades
- [ ] Permissive license (MIT, Apache-2.0, BSD). Flag anything else
- [ ] First-class TypeScript support
- [ ] No known security advisories (`npm audit`)
- [ ] Compatible with our Next.js, React, Node and Prisma versions
- [ ] Small, few transitive dependencies, and replaceable within a day or two

When proposing one, state the problem, why built-ins or existing code are not enough, the
alternatives considered and how it passes the checks. Record it in `/plans/decisions/`.

**Wrap central third-party libraries behind our own interface in `src/core/`** (email,
storage, PDF, payments, queues, logging). Business code never calls them directly.

**Version rules:** commit the lockfile; pin the Node version (`.nvmrc`, `engines`); never use
`latest` or wildcards for core dependencies; no **major** upgrades during feature work (they are
separate planned tasks with their own branch and full test run); remove unused packages; never
install from unverified sources.

## 16. Core building blocks still to build (one at a time, when first needed)

Build in `src/core/` or `src/shared/`. Check whether it already exists first. Do not build all
at once. (Already decided in plan 01: shared CRM UI kit, API conventions, module system.)

| Block | Purpose |
|---|---|
| Standard validation schemas shared by API and forms | One source of truth for rules |
| Audit log | Who changed what, when |
| Generic list filters/sort/pagination wiring | Used by every module |
| Custom fields per tenant | Clients always need extra fields |
| Document numbering (Q-0001, SO-0001) per tenant | Shared service |
| Status and lifecycle helper | Consistent statuses and allowed changes |
| Notifications (in-app, email) | Behind our own interface |
| Background jobs and scheduling | Behind our own interface |
| File and attachment storage | Provider wrapper |
| Import / export (CSV, Excel, PDF) | Shared utilities |
| Settings and feature flags per tenant | Clients differ without code changes |
| Logging and error tracking | Structured, no secrets |
| Money, tax, date helpers | Decimal types for money, never floats |
| Localization, currency, timezone | Keep text out of components |
| Module manifest + client profile | List of enabled modules per client |
| Client setup / module removal script | Strip unused modules and seed a new client copy |
| Base modules: Customers/Contacts, Products/Items | Shared master data for sales modules |
| Seed and test data tools | Repeatable, tenant-aware |
| Module generator from `_template` | New module in minutes |
| Test utilities and factories | Faster tests |
| CI checks (lint, types, tests, audit) | Must pass before merge |

## 17. Change discipline

- Smallest change that fully solves the task. No unrelated refactors.
- No dependency added or upgraded without Section 15 and approval.
- Do not change `core`, the Prisma schema, tenancy or workflow behaviour without flagging the
  impact on other modules.
- No silent breaking changes. List them.

## 18. Definition of done and reporting

- [ ] Followed the relevant plans (or flagged a needed plan update)
- [ ] Layers, module independence and naming rules respected
- [ ] Doc comments added, module README updated
- [ ] Input validation, auth, `tenantId` scoping and permissions in place
- [ ] Tests added or updated and passing, including cross-tenant checks where relevant
- [ ] Lint and type-check pass
- [ ] Nothing client-specific hard-coded; no dependency added without Section 15
- [ ] Plan status and Result updated

When finished, report: what changed and why, files touched, decisions made, anything you were
unsure about, risks, and anything the developer should review. If you could not follow a rule
here, say so.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
