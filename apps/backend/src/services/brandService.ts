import { prisma, withTenantTransaction } from "../prismaClient.js";
import { auditService } from "./auditService.js";

export const brandService = {
    async createBrand(tenantId: string, userId: string | undefined, data: any, auditMeta?: any) {
        return withTenantTransaction(tenantId, async (tx) => {
            const brand = await tx.brand.create({
                data: {
                    tenantId,
                    code: data.code,
                    name: data.name,
                    legalName: data.legalName,
                    description: data.description,
                    logo: data.logo,
                    website: data.website,
                    email: data.email,
                    phone: data.phone,
                    status: data.status || "ACTIVE"
                }
            });

            if (userId) {
                await auditService.logEvent(tx, {
                    tenantId,
                    userId,
                    entityType: "Brand",
                    entityId: brand.id,
                    operation: "CREATE",
                    afterState: brand,
                    auditMeta
                });
            }

            return brand;
        });
    },

    async updateBrand(tenantId: string, userId: string | undefined, brandId: string, data: any, auditMeta?: any) {
        return withTenantTransaction(tenantId, async (tx) => {
            const existing = await tx.brand.findUnique({ where: { id: brandId, deletedAt: null } });
            if (!existing || existing.tenantId !== tenantId) return null;

            const updated = await tx.brand.update({
                where: { id: brandId },
                data: {
                    code: data.code !== undefined ? data.code : existing.code,
                    name: data.name !== undefined ? data.name : existing.name,
                    legalName: data.legalName !== undefined ? data.legalName : existing.legalName,
                    description: data.description !== undefined ? data.description : existing.description,
                    logo: data.logo !== undefined ? data.logo : existing.logo,
                    website: data.website !== undefined ? data.website : existing.website,
                    email: data.email !== undefined ? data.email : existing.email,
                    phone: data.phone !== undefined ? data.phone : existing.phone,
                    status: data.status !== undefined ? data.status : existing.status,
                }
            });

            if (userId) {
                await auditService.logEvent(tx, {
                    tenantId,
                    userId,
                    entityType: "Brand",
                    entityId: updated.id,
                    operation: "UPDATE",
                    beforeState: existing,
                    afterState: updated,
                    auditMeta
                });
            }

            return updated;
        });
    },

    async deleteBrand(tenantId: string, userId: string | undefined, brandId: string, auditMeta?: any) {
        return withTenantTransaction(tenantId, async (tx) => {
            const existing = await tx.brand.findUnique({ where: { id: brandId, deletedAt: null } });
            if (!existing || existing.tenantId !== tenantId) return null;

            const deleted = await tx.brand.update({
                where: { id: brandId },
                data: { deletedAt: new Date() }
            });

            if (userId) {
                await auditService.logEvent(tx, {
                    tenantId,
                    userId,
                    entityType: "Brand",
                    entityId: deleted.id,
                    operation: "DELETE",
                    beforeState: existing,
                    afterState: deleted,
                    auditMeta
                });
            }

            return deleted;
        });
    }
};
