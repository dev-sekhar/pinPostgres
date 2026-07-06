import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

const connectionString = process.env.APP_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL or APP_DATABASE_URL is required");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const basePrisma = new PrismaClient({ adapter });

export const prisma = basePrisma.$extends({
    query: {
        role: {
            async update({ args, query }) {
                // If they are trying to update by ID, we could check if it's SYSTEM.
                // A safer way is to ensure we don't update SYSTEM roles by enforcing it in the where clause, 
                // but checking before update is easier.
                if (args.where.id) {
                    const role = await basePrisma.role.findUnique({ where: { id: args.where.id } });
                    if (role?.roleType === 'SYSTEM') {
                        throw new Error("Cannot edit a SYSTEM role.");
                    }
                }
                return query(args);
            },
            async delete({ args, query }) {
                if (args.where.id) {
                    const role = await basePrisma.role.findUnique({ where: { id: args.where.id } });
                    if (role?.roleType === 'SYSTEM') {
                        throw new Error("Cannot delete a SYSTEM role.");
                    }
                }
                return query(args);
            },
            async updateMany({ args, query }) {
                // Prevent bulk update if it touches SYSTEM roles
                throw new Error("Bulk updating roles is disabled to protect SYSTEM roles.");
            },
            async deleteMany({ args, query }) {
                // Prevent bulk delete if it touches SYSTEM roles
                throw new Error("Bulk deleting roles is disabled to protect SYSTEM roles.");
            }
        }
    }
});

export async function withTenantTransaction<T>(
    tenantId: string,
    callback: (tx: any) => Promise<T>
): Promise<T> {
    return prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
        return callback(tx);
    });
}
