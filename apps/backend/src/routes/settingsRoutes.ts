import { Router } from "express";
import { prisma, withTenantTransaction } from "../prismaClient.js";
import { requireAuth, AuthRequest } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/rbacMiddleware.js";
import { auditService } from "../services/auditService.js";

const router = Router();
router.use(requireAuth as any);

// GET /api/settings/sku
router.get("/sku", requirePermission("settings.read") as any, async (req: AuthRequest, res) => {
    let settings = await prisma.tenantSettings.findUnique({
                where: { tenantId: req.user!.tenantId }
            });
    if (!settings) {
                settings = await prisma.tenantSettings.create({
                    data: { tenantId: req.user!.tenantId }
                });
            }
    res.json(settings);
});

// PUT /api/settings/sku
router.put("/sku", requirePermission("settings.update") as any, async (req: AuthRequest, res) => {
    const { productSkuPattern, variantSkuPattern } = req.body;
    
    if (!productSkuPattern || !variantSkuPattern) {
        return res.status(400).json({ error: "Missing required pattern fields" });
    }

    const settings = await withTenantTransaction(req.user!.tenantId, async (tx) => {
                let existing = await tx.tenantSettings.findUnique({
                    where: { tenantId: req.user!.tenantId }
                });

                if (!existing) {
                    existing = await tx.tenantSettings.create({
                        data: { tenantId: req.user!.tenantId }
                    });
                }

                const updated = await tx.tenantSettings.update({
                    where: { tenantId: req.user!.tenantId },
                    data: { productSkuPattern, variantSkuPattern }
                });

                await auditService.logEvent(tx, {
                    tenantId: req.user!.tenantId,
                    userId: req.user!.userId,
                    entityType: 'TenantSettings',
                    entityId: updated.id,
                    operation: 'UPDATE',
                    beforeState: existing,
                    afterState: updated,
                    auditMeta: (req as any).auditMeta
                });

                return updated;
            });
    res.json(settings);
});

export default router;
