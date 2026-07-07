import { Router } from "express";
import { prisma, withTenantTransaction } from "./prismaClient.js";
import { requireAuth, AuthRequest } from "./authMiddleware.js";
import { requirePermission } from "./rbacMiddleware.js";
import { auditService } from "./services/auditService.js";

const router = Router();
router.use(requireAuth as any);

// GET /api/product-families
router.get("/", async (req: AuthRequest, res) => {
    try {
        const productFamilies = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.productFamily.findMany({
                where: { deletedAt: null },
                orderBy: { name: "asc" }
            });
        });
        res.json(productFamilies);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch product families" });
    }
});

// GET /api/product-families/:id
router.get("/:id", async (req: AuthRequest, res) => {
    try {
        const productFamily = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.productFamily.findUnique({
                where: { id: req.params.id, deletedAt: null },
                include: { 
                    attributeDefinitions: { where: { deletedAt: null } },
                    products: { where: { deletedAt: null, parentId: null } }
                }
            });
        });
        if (!productFamily) return res.status(404).json({ error: "Product family not found" });
        res.json(productFamily);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch product family" });
    }
});

// POST /api/product-families
router.post("/", requirePermission("productFamily.create") as any, async (req: AuthRequest, res) => {
    const { name, description, categoryId } = req.body;
    if (!name || !categoryId) return res.status(400).json({ error: "Name and categoryId are required" });
    try {
        const productFamily = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const newFamily = await tx.productFamily.create({
                data: { name: name.trim(), description, categoryId, tenantId: req.user!.tenantId }
            });
            await auditService.logEvent(tx, {
                tenantId: req.user!.tenantId,
                userId: req.user!.userId,
                entityType: 'ProductFamily',
                entityId: newFamily.id,
                operation: 'CREATE',
                afterState: newFamily,
                auditMeta: (req as any).auditMeta
            });
            return newFamily;
        });
        res.status(201).json(productFamily);
    } catch (error) {
        res.status(500).json({ error: "Failed to create product family" });
    }
});

// PUT /api/product-families/:id
router.put("/:id", requirePermission("productFamily.update") as any, async (req: AuthRequest, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    try {
        const productFamily = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const existing = await tx.productFamily.findUnique({ where: { id: req.params.id, deletedAt: null } });
            if (!existing) throw new Error("Product family not found");

            const updated = await tx.productFamily.update({
                where: { id: req.params.id },
                data: { name: name.trim(), description }
            });

            await auditService.logEvent(tx, {
                tenantId: req.user!.tenantId,
                userId: req.user!.userId,
                entityType: 'ProductFamily',
                entityId: updated.id,
                operation: 'UPDATE',
                beforeState: existing,
                afterState: updated,
                changedFields: req.body,
                auditMeta: (req as any).auditMeta
            });
            return updated;
        });
        res.json(productFamily);
    } catch (error) {
        res.status(500).json({ error: "Failed to update product family" });
    }
});

// DELETE /api/product-families/:id
router.delete("/:id", requirePermission("productFamily.delete") as any, async (req: AuthRequest, res) => {
    try {
        await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const existing = await tx.productFamily.findUnique({ where: { id: req.params.id, deletedAt: null } });
            if (!existing) throw new Error("Product family not found");

            const deleted = await tx.productFamily.update({
                where: { id: req.params.id },
                data: { deletedAt: new Date() }
            });

            await auditService.logEvent(tx, {
                tenantId: req.user!.tenantId,
                userId: req.user!.userId,
                entityType: 'ProductFamily',
                entityId: deleted.id,
                operation: 'DELETE',
                beforeState: existing,
                afterState: deleted,
                auditMeta: (req as any).auditMeta
            });
            return deleted;
        });
        res.json({ message: "Product family deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete product family" });
    }
});

export default router;
