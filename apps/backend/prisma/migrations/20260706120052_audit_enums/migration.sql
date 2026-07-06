/*
  Warnings:

  - The `source` column on the `AuditLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `operation` on the `AuditLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AuditOperation" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOGIN', 'LOGOUT', 'IMPORT', 'EXPORT', 'PUBLISH', 'UNPUBLISH', 'APPROVE', 'REJECT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AuditSource" AS ENUM ('WEB', 'API', 'IMPORT', 'AI', 'SYSTEM');

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "operation",
ADD COLUMN     "operation" "AuditOperation" NOT NULL,
DROP COLUMN "source",
ADD COLUMN     "source" "AuditSource";
