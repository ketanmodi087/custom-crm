# CRM

A single-tenant CRM built with Next.js, TypeScript, MUI, Auth.js,
PostgreSQL, and Prisma.

## Included

- Email/password authentication
- Password reset through Brevo
- Tenant-isolated data access
- Permission-filtered navigation and APIs
- Customer profiles with nested contact management
- Link Leads to existing Customers and Contacts
- Convert qualified Leads into a new Customer and Contact atomically
- Related Leads displayed on Customer profiles
- Basic Lead search, filtering, pagination, create, edit, and soft delete
- Transactional backend audit records for every Customer, Contact, and Lead mutation
- Responsive MUI application shell

## Intentionally excluded

Platform/Super Admin tenant management, dynamic hierarchy, identity-management screens,
MFA, active sessions, configurable pipelines, Lead activities, GST calculations, and
conversion workflows.

## Setup

```powershell
Copy-Item .env.example .env
npm install
npm run db:deploy
npm run db:seed
npm run dev
```

Set `DATABASE_URL`, `AUTH_SECRET`, `SEED_ADMIN_EMAIL`, and `SEED_ADMIN_PASSWORD` in `.env`
before deploying or seeding. Use a dedicated empty database such as `crm`; do not
point this migration at another application's database. Configure the Brevo
variables if password reset email is required.

## Verification

```powershell
npm run lint
npm run typecheck
npm run build
```

The build command generates Prisma Client and compiles Next.js. It never pushes schema changes,
accepts data loss, or seeds a database automatically.

## Module boundaries

The enabled business modules are `src/modules/customers` and `src/modules/leads`. The Customers
module owns both customer and contact master data. Client-specific workflow wiring lives in
`src/modules/client-lead-customer`; the business modules do not import each other. Database calls
live in repositories, business transactions live in services, validation lives in module types,
and HTTP handling stays inside thin App Router route handlers.
