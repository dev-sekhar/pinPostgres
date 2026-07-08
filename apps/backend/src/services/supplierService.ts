import { prisma } from "../prismaClient.js";
import { auditService } from "./auditService.js";

export const supplierService = {
    async getSuppliers(tenantId: string) {
        return prisma.supplier.findMany({
            where: { tenantId, deletedAt: null },
            orderBy: { name: 'asc' }
        });
    },

    async getSupplierById(tenantId: string, id: string) {
        return prisma.supplier.findUnique({
            where: { id, tenantId, deletedAt: null }
        });
    },

    async createSupplier(tenantId: string, userId: string, data: { code: string, name: string, description?: string, status?: string }, auditMeta?: any) {
        return prisma.$transaction(async (tx) => {
            const supplier = await tx.supplier.create({
                data: {
                    ...data,
                    tenantId
                }
            });

            await auditService.logEvent(tx as any, {
                tenantId,
                userId,
                entityType: 'Supplier',
                entityId: supplier.id,
                operation: 'CREATE',
                afterState: supplier,
                auditMeta
            });

            return supplier;
        });
    },

    async updateSupplier(tenantId: string, userId: string, id: string, data: { code?: string, name?: string, description?: string, status?: string }, auditMeta?: any) {
        return prisma.$transaction(async (tx) => {
            const existing = await tx.supplier.findUnique({ where: { id, tenantId } });
            if (!existing) throw new Error("Supplier not found");

            const supplier = await tx.supplier.update({
                where: { id },
                data
            });

            await auditService.logEvent(tx as any, {
                tenantId,
                userId,
                entityType: 'Supplier',
                entityId: supplier.id,
                operation: 'UPDATE',
                beforeState: existing,
                afterState: supplier,
                auditMeta
            });

            return supplier;
        });
    },

    async deleteSupplier(tenantId: string, userId: string, id: string, auditMeta?: any) {
        return prisma.$transaction(async (tx) => {
            const existing = await tx.supplier.findUnique({ where: { id, tenantId } });
            if (!existing) throw new Error("Supplier not found");

            const supplier = await tx.supplier.update({
                where: { id },
                data: { deletedAt: new Date() }
            });

            await auditService.logEvent(tx as any, {
                tenantId,
                userId,
                entityType: 'Supplier',
                entityId: supplier.id,
                operation: 'DELETE',
                beforeState: existing,
                afterState: supplier,
                auditMeta
            });

            return supplier;
        });
    }
};
