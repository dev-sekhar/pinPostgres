import { prisma } from "../prismaClient.js";
import { auditService } from "./auditService.js";

export const manufacturerService = {
    async getManufacturers() {
        return prisma.manufacturer.findMany({
            where: { deletedAt: null },
            orderBy: { name: 'asc' }
        });
    },

    async getManufacturerById(id: string) {
        return prisma.manufacturer.findUnique({
            where: { id, deletedAt: null }
        });
    },

    async createManufacturer(userTenantId: string, userId: string, data: { code: string, name: string, description?: string, contactInfo?: any, status?: string }, auditMeta?: any) {
        return prisma.$transaction(async (tx) => {
            const manufacturer = await tx.manufacturer.create({
                data
            });

            await auditService.logEvent(tx as any, {
                tenantId: userTenantId,
                userId,
                entityType: 'Manufacturer',
                entityId: manufacturer.id,
                operation: 'CREATE',
                afterState: manufacturer,
                auditMeta
            });

            return manufacturer;
        });
    },

    async updateManufacturer(userTenantId: string, userId: string, id: string, data: { code?: string, name?: string, description?: string, contactInfo?: any, status?: string }, auditMeta?: any) {
        return prisma.$transaction(async (tx) => {
            const existing = await tx.manufacturer.findUnique({ where: { id } });
            if (!existing) throw new Error("Manufacturer not found");

            const manufacturer = await tx.manufacturer.update({
                where: { id },
                data
            });

            await auditService.logEvent(tx as any, {
                tenantId: userTenantId,
                userId,
                entityType: 'Manufacturer',
                entityId: manufacturer.id,
                operation: 'UPDATE',
                beforeState: existing,
                afterState: manufacturer,
                auditMeta
            });

            return manufacturer;
        });
    },

    async deleteManufacturer(userTenantId: string, userId: string, id: string, auditMeta?: any) {
        return prisma.$transaction(async (tx) => {
            const existing = await tx.manufacturer.findUnique({ where: { id } });
            if (!existing) throw new Error("Manufacturer not found");

            const manufacturer = await tx.manufacturer.update({
                where: { id },
                data: { deletedAt: new Date() }
            });

            await auditService.logEvent(tx as any, {
                tenantId: userTenantId,
                userId,
                entityType: 'Manufacturer',
                entityId: manufacturer.id,
                operation: 'DELETE',
                beforeState: existing,
                afterState: manufacturer,
                auditMeta
            });

            return manufacturer;
        });
    }
};
