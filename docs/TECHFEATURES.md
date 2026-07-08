# PIM Postgres: Platform Features & Capabilities

This document outlines the core features, architectural decisions, and capabilities built into the PIM Postgres platform.

## 1. Core Architecture
- **Monorepo Structure (Yarn Workspaces)**: The platform is split into specialized workspaces for clean separation of concerns (`apps/frontend`, `apps/backend`, `packages/validation`).
- **Tech Stack**: 
  - **Database**: PostgreSQL (managed via Prisma ORM)
  - **Backend**: Node.js & Express.js (TypeScript)
  - **Frontend**: Next.js React application (App Router)
  - **Shared Libraries**: Centralized validation packages.

## 2. Multi-Tenancy & Security
- **Strict Data Isolation**: Multi-tenancy is baked into the Prisma schema. All read and write operations are strictly scoped to the user's `tenantId`, ensuring absolute data privacy between organizations.
- **Authentication**: JWT-based authentication via the `authMiddleware.ts`.
- **Role-Based Access Control (RBAC)**: A granular permission engine governs the API. Specific endpoints require specific privileges (e.g., `brand.create`, `category.status.update`).
- **Audit Trails**: Extensive audit logging for entity creation, modification, and status transitions, ensuring full traceability of user actions (including IP and User Agent tracking).

## 3. Master Data Management
The system provides full CRUD operations and lifecycle management (Active/Inactive statuses) for the following core entities:
- **Domains**
- **Categories**
- **Product Families**
- **Brands**
- **Manufacturers**
- **Suppliers**
- **Channels**
- **Compliance Types**

## 4. Product Information Management (PIM)
- **Hierarchical Products**: Support for Base Products (parents) and Variants (children) for complex retail structures.
- **SKU Management**: Dedicated lifecycle and uniqueness enforcement for Stock Keeping Units.
- **Extensible Attributes**: Dynamic attributes attached to entities, allowing the system to scale beyond static database columns.

## 5. Centralized Validation Framework
A robust, industry-standard validation pipeline that ensures data integrity across the entire stack.
- **Single Source of Truth**: Format and schema definitions are stored as modular JSON Schemas in `packages/validation/schemas/json/`.
- **Backend Enforcement**: Express middleware uses `Ajv` to strictly enforce the JSON schemas at the API boundary before data reaches the database.
- **Business Rule Engine**: Asynchronous validations (such as verifying SKU or Code uniqueness across a tenant) are managed by the unified `ValidationService`.
- **Frontend Synergy**: The `yarn dev` pipeline automatically generates Zod adapters from the JSON schemas (`json-schema-to-zod`). The Next.js frontend uses these generated schemas with `react-hook-form` for ergonomic, type-safe UI validation prior to submission.
- **Bulk Readiness**: The backend validation service includes a `validateBatch` method designed to support scalable "partial acceptance" for future CSV bulk uploads.

## 6. Frontend Interface
- **Next.js App Router**: Modern, server-side rendered application.
- **Dynamic Forms**: Auto-validating user interfaces leveraging `react-hook-form` connected directly to the shared Zod schema infrastructure.
