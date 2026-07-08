import { Router } from "express";
import { validateSchema } from "../middleware/schemaValidation.js";
import { withTenantTransaction } from "../prismaClient.js";
import { requireAuth, AuthRequest } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/rbacMiddleware.js";
import { auditService } from "../services/auditService.js";
import { assetService } from "../services/assetService.js";

const router = Router();

router.use(requireAuth as any);

// GET /api/assets
router.get("/", requirePermission("asset.read") as any, async (req: AuthRequest, res) => {
    const assets = await withTenantTransaction(req.user!.tenantId, async (tx) => {
        return assetService.getAssets(tx, req.user!.tenantId);
    });
    res.json(assets);
});

// GET /api/assets/:id
router.get("/:id", requirePermission("asset.read") as any, async (req: AuthRequest, res) => {
    const asset = await withTenantTransaction(req.user!.tenantId, async (tx) => {
        return assetService.getAssetById(tx, req.user!.tenantId, req.params.id);
    });
    res.json(asset);
});

// POST /api/assets
router.post("/", requirePermission("asset.create") as any, validateSchema("Asset") as any, async (req: AuthRequest, res) => {
    const asset = await withTenantTransaction(req.user!.tenantId, async (tx) => {
        const newAsset = await assetService.createAsset(tx, req.user!.tenantId, req.body);
        
        await auditService.logEvent(tx, {
            tenantId: req.user!.tenantId,
            userId: req.user!.userId,
            entityType: 'Asset',
            entityId: newAsset.id,
            operation: 'CREATE',
            remarks: 'Asset URL uploaded',
            afterState: newAsset,
            auditMeta: (req as any).auditMeta
        });

        return newAsset;
    });
    res.status(201).json(asset);
});

// PUT /api/assets/:id
router.put("/:id", requirePermission("asset.update") as any, async (req: AuthRequest, res) => {
    const asset = await withTenantTransaction(req.user!.tenantId, async (tx) => {
        const updatedAsset = await assetService.updateAsset(tx, req.user!.tenantId, req.params.id, req.body);
        
        await auditService.logEvent(tx, {
            tenantId: req.user!.tenantId,
            userId: req.user!.userId,
            entityType: 'Asset',
            entityId: updatedAsset.id,
            operation: 'UPDATE',
            remarks: 'Asset updated',
            afterState: updatedAsset,
            auditMeta: (req as any).auditMeta
        });

        return updatedAsset;
    });
    res.json(asset);
});

// DELETE /api/assets/:id
router.delete("/:id", requirePermission("asset.delete") as any, async (req: AuthRequest, res) => {
    await withTenantTransaction(req.user!.tenantId, async (tx) => {
        await assetService.deleteAsset(tx, req.user!.tenantId, req.params.id);
        
        await auditService.logEvent(tx, {
            tenantId: req.user!.tenantId,
            userId: req.user!.userId,
            entityType: 'Asset',
            entityId: req.params.id,
            operation: 'DELETE',
            remarks: 'Asset logically deleted',
            auditMeta: (req as any).auditMeta
        });
    });
    res.status(204).send();
});

export default router;
