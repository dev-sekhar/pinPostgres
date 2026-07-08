import { PrismaClient } from "../generated/prisma/client.js";

export const skuService = {
    /**
     * Preview the next base product SKU without incrementing the database sequence.
     */
    async previewNextSku(tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">, tenantId: string): Promise<string> {
        let settings = await tx.tenantSettings.findUnique({ where: { tenantId } });
        if (!settings) {
            // Default pattern if settings not found
            return "SKU-001";
        }
        const nextSeqStr = String(settings.productSkuSeq + 1).padStart(3, '0');
        return settings.productSkuPattern.replace("{SEQ}", nextSeqStr);
    },

    /**
     * Preview the next variant SKU without incrementing the database sequence.
     * Uses the global productSkuSeq for variants as per user requirement.
     */
    async previewNextVariantSku(tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">, tenantId: string, parentSku: string): Promise<string> {
        let settings = await tx.tenantSettings.findUnique({ where: { tenantId } });
        if (!settings) {
            return `${parentSku}-VAR-001`;
        }
        const nextSeqStr = String(settings.productSkuSeq + 1).padStart(3, '0');
        return settings.variantSkuPattern
            .replace("{PARENT_SKU}", parentSku)
            .replace("{SEQ}", nextSeqStr);
    },

    /**
     * Atomically increment and return the next base product SKU.
     */
    async generateAndClaimNextSku(tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">, tenantId: string): Promise<string> {
        let settings = await tx.tenantSettings.findUnique({ where: { tenantId } });
        if (!settings) {
            settings = await tx.tenantSettings.create({ data: { tenantId } });
        }

        const updatedSettings = await tx.tenantSettings.update({
            where: { tenantId },
            data: { productSkuSeq: { increment: 1 } }
        });

        const seqStr = String(updatedSettings.productSkuSeq).padStart(3, '0');
        return updatedSettings.productSkuPattern.replace("{SEQ}", seqStr);
    },

    /**
     * Atomically increment and return the next variant SKU using the global productSkuSeq.
     */
    async generateAndClaimNextVariantSku(tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">, tenantId: string, parentSku: string): Promise<string> {
        let settings = await tx.tenantSettings.findUnique({ where: { tenantId } });
        if (!settings) {
            settings = await tx.tenantSettings.create({ data: { tenantId } });
        }

        const updatedSettings = await tx.tenantSettings.update({
            where: { tenantId },
            data: { productSkuSeq: { increment: 1 } } // Use global seq for variant as per user req
        });

        const seqStr = String(updatedSettings.productSkuSeq).padStart(3, '0');
        return updatedSettings.variantSkuPattern
            .replace("{PARENT_SKU}", parentSku)
            .replace("{SEQ}", seqStr);
    }
};
