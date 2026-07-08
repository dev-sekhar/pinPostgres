import { prisma } from "../prismaClient.js";
import { auditService } from "./auditService.js";

export const complianceTypeService = {
    async getComplianceTypes() {
        return prisma.complianceType.findMany({
            where: { deletedAt: null },
            orderBy: { name: 'asc' }
        });
    },

    async getComplianceTypeById(id: string) {
        return prisma.complianceType.findUnique({
            where: { id, deletedAt: null }
        });
    },

    async createComplianceType(userTenantId: string, userId: string, data: { code: string, name: string, description?: string, status?: string }, auditMeta?: any) {
        return prisma.$transaction(async (tx) => {
            const complianceType = await tx.complianceType.create({
                data
            });

            await auditService.logEvent(tx as any, {
                tenantId: userTenantId,
                userId,
                entityType: 'ComplianceType',
                entityId: complianceType.id,
                operation: 'CREATE',
                afterState: complianceType,
                auditMeta
            });

            return complianceType;
        });
    },

    async updateComplianceType(userTenantId: string, userId: string, id: string, data: { code?: string, name?: string, description?: string, status?: string }, auditMeta?: any) {
        return prisma.$transaction(async (tx) => {
            const existing = await tx.complianceType.findUnique({ where: { id } });
            if (!existing) throw new Error("ComplianceType not found");

            const complianceType = await tx.complianceType.update({
                where: { id },
                data
            });

            await auditService.logEvent(tx as any, {
                tenantId: userTenantId,
                userId,
                entityType: 'ComplianceType',
                entityId: complianceType.id,
                operation: 'UPDATE',
                beforeState: existing,
                afterState: complianceType,
                auditMeta
            });

            return complianceType;
        });
    },

    async deleteComplianceType(userTenantId: string, userId: string, id: string, auditMeta?: any) {
        return prisma.$transaction(async (tx) => {
            const existing = await tx.complianceType.findUnique({ where: { id } });
            if (!existing) throw new Error("ComplianceType not found");

            const complianceType = await tx.complianceType.update({
                where: { id },
                data: { deletedAt: new Date() }
            });

            await auditService.logEvent(tx as any, {
                tenantId: userTenantId,
                userId,
                entityType: 'ComplianceType',
                entityId: complianceType.id,
                operation: 'DELETE',
                beforeState: existing,
                afterState: complianceType,
                auditMeta
            });

            return complianceType;
        });
    }
};
