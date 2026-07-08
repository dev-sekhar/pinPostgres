# PIM Postgres

**PIM Postgres** is an enterprise-grade Product Information Management (PIM) platform engineered to centralize, manage, and syndicate complex product catalogs. Built natively for multi-tenancy, it provides organizations with a single source of truth for their master data—encompassing brands, manufacturers, suppliers, compliance standards, and highly-dimensional hierarchical products.

At its core, PIM Postgres prioritizes data integrity and security. It leverages a centralized, JSON-Schema-driven validation pipeline that seamlessly governs data entry from the frontend UI all the way down to the asynchronous business logic in the backend. Coupled with a granular Role-Based Access Control (RBAC) engine and comprehensive audit logging, the platform ensures that your catalog remains clean, secure, and fully traceable.

Whether you are managing simple flat product lists or complex multi-variant retail structures, PIM Postgres delivers the scalability and governance required by modern retail and manufacturing ecosystems.
## Architecture

This is a monorepo utilizing Yarn Workspaces, structured as follows:

```
pimPostgres/
├── apps/
│   ├── backend/               # Express.js REST API
│   │   ├── prisma/            # Prisma schema and migrations
│   │   └── src/
│   │       ├── middleware/    # Express middleware (Auth, RBAC, Validation)
│   │       ├── routes/        # API endpoints
│   │       ├── services/      # Core business logic
│   │       └── utils/         # Helper functions
│   └── frontend/              # Next.js React application
├── packages/
│   └── validation/            # Shared JSON Schemas and Zod definitions
└── db/
    └── sql/                   # Seed files and raw SQL scripts
```

## Getting Started

1. Install dependencies:
   ```bash
   yarn install
   ```
2. Start the development environment (spins up both backend, frontend, and schema generators):
   ```bash
   yarn dev
   ```

## Workspaces
- `apps/backend`: Handles all master data processing, role-based access control, and asynchronous business validation.
- `apps/frontend`: User interface integrated with `react-hook-form` and server-side components.
- `packages/validation`: Acts as the single source of truth for entity format and structure. JSON schemas are strictly enforced in the backend via Ajv, while Zod equivalents are automatically generated for frontend form inference.
