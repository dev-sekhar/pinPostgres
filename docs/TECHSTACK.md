# Technology Stack

## 1. Core Platform
- **Runtime**: Node.js v22 (via `tsx` for native ESM execution)
- **Language**: TypeScript (End-to-end)
- **Package Manager**: Yarn (Workspaces / Monorepo setup)

## 2. Database & Data Layer
- **Relational Database**: PostgreSQL
- **ORM / Query Builder**: Prisma

## 3. Backend (API Layer)
- **Framework**: Express.js
- **Routing & Middleware**: Modular Express Routers
- **Authentication**: JWT (JSON Web Tokens)
- **Validation (Synchronous)**: `Ajv` (JSON Schema validator)

## 4. Frontend (UI Layer)
- **Framework**: Next.js (React App Router)
- **Forms**: `react-hook-form`
- **Form Validation**: `zod` and `@hookform/resolvers`

## 5. Shared Tooling
- **Schema Generator**: `json-schema-to-zod` (Auto-compiles Zod models from JSON schemas during `yarn dev`)
- **Linting & Formatting**: ESLint / Prettier (Standard configurations)
