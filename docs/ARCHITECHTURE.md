# Platform Architecture

PIM Postgres is designed as a modular, scalable, multi-tenant monorepo.

## 1. Monorepo Organization
The repository is managed using **Yarn Workspaces**, dividing the application into distinct boundaries:
- `apps/frontend/`: Next.js React Application (UI Layer)
- `apps/backend/`: Node.js Express Server (API & Business Logic)
- `packages/validation/`: Shared module containing our central source of truth for entity schemas.

## 2. Multi-Tenancy & Data Isolation
The core database schema is designed for multi-tenancy. Every entity (e.g., Brand, Product, User) is linked to a `tenantId`. 
All database queries in the backend are funneled through `withTenantTransaction(tenantId, ...)`, guaranteeing that data cannot leak between tenants.

## 3. The Validation Pipeline
We employ a robust, schema-driven validation architecture:
1. **Source of Truth**: JSON Schemas are stored in `packages/validation/schemas/json/`.
2. **Backend Enforcement**: Express routes are guarded by `schemaValidation.ts` middleware, which uses `Ajv` to strictly enforce the JSON Schema formats synchronously.
3. **Business Rules**: Validations requiring database lookups (e.g., unique constraints) are handled asynchronously by `ValidationService.ts` before committing to the DB.
4. **Frontend Symbiosis**: During the build step (`yarn dev`), Zod schemas are automatically compiled from the JSON Schemas and exported for the frontend. The Next.js UI uses `react-hook-form` and `@hookform/resolvers/zod` to validate forms matching the backend's exact expectations.

## 4. Security & RBAC
- **Authentication**: JWT-based stateless authentication (`authMiddleware.ts`).
- **Authorization**: A granular Role-Based Access Control (RBAC) engine restricts endpoints via `rbacMiddleware.ts` (e.g., `requirePermission("brand.create")`).

## 5. Audit Logging
Every mutation (create, update, delete, status change) is intercepted and logged into an `AuditLog` table. This tracks the user, tenant, action performed, delta changes (before/after), and network metadata (IP, User Agent).
