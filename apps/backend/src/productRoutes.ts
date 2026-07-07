import { Router } from "express";
import { prisma, withTenantTransaction } from "./prismaClient.js";
import { requireAuth, AuthRequest } from "./authMiddleware.js";
import { auditService } from "./services/auditService.js";
import { requirePermission } from "./rbacMiddleware.js";

const router = Router();

router.use(requireAuth as any);

// GET /api/products
router.get("/", requirePermission("product.read") as any, async (req: AuthRequest, res) => {
    try {
        const products = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.product.findMany({
                where: { deletedAt: null, parentId: null },
                take: 50,
                orderBy: { createdAt: "desc" },
            });
        });
        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/products/:id
router.get("/:id", requirePermission("product.read") as any, async (req: AuthRequest, res) => {
    try {
        const product = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.product.findUnique({
                where: { id: req.params.id, deletedAt: null },
                include: { variants: { where: { deletedAt: null } } }
            });
        });
        if (!product) return res.status(404).json({ error: "Product not found" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/products
router.post("/", requirePermission("product.create") as any, async (req: AuthRequest, res) => {
    const { sku, name, description, price, parentId, attributes, productFamilyId } = req.body;
    if (!sku || !name || price === undefined || !productFamilyId) {
        return res.status(400).json({ error: "Missing required fields (sku, name, price, productFamilyId)" });
    }
    try {
        const product = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const newProduct = await tx.product.create({
                data: { sku, name, description, price, parentId, attributes, productFamilyId, tenantId: req.user!.tenantId }
            });
            
            await auditService.logEvent(tx, {
                tenantId: req.user!.tenantId,
                userId: req.user!.userId,
                entityType: 'Product',
                entityId: newProduct.id,
                operation: 'CREATE',
                afterState: newProduct,
                auditMeta: (req as any).auditMeta
            });
            
            return newProduct;
        });

        res.status(201).json(product);
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// PUT /api/products/:id
router.put("/:id", requirePermission("product.update") as any, async (req: AuthRequest, res) => {
    const { sku, name, description, price, attributes, productFamilyId } = req.body;
    if (!sku || !name || price === undefined || !productFamilyId) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        const product = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const existing = await tx.product.findUnique({ where: { id: req.params.id, deletedAt: null } });
            if (!existing) throw new Error("Product not found");

            const updated = await tx.product.update({
                where: { id: req.params.id },
                data: { sku, name, description, price, attributes, productFamilyId }
            });

            await auditService.logEvent(tx, {
                tenantId: req.user!.tenantId,
                userId: req.user!.userId,
                entityType: 'Product',
                entityId: updated.id,
                operation: 'UPDATE',
                beforeState: existing,
                afterState: updated,
                changedFields: req.body,
                auditMeta: (req as any).auditMeta
            });
            return updated;
        });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: "Failed to update product" });
    }
});

// PATCH /api/products/:id
router.patch("/:id", requirePermission("product.update") as any, async (req: AuthRequest, res) => {
    try {
        const product = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const existing = await tx.product.findUnique({ where: { id: req.params.id, deletedAt: null } });
            if (!existing) throw new Error("Product not found");

            const updated = await tx.product.update({
                where: { id: req.params.id },
                data: req.body
            });

            await auditService.logEvent(tx, {
                tenantId: req.user!.tenantId,
                userId: req.user!.userId,
                entityType: 'Product',
                entityId: updated.id,
                operation: 'UPDATE',
                beforeState: existing,
                afterState: updated,
                changedFields: req.body,
                auditMeta: (req as any).auditMeta
            });
            return updated;
        });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: "Failed to update product" });
    }
});

// DELETE /api/products/:id (Soft Delete)
router.delete("/:id", requirePermission("product.delete") as any, async (req: AuthRequest, res) => {
    try {
        await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const existing = await tx.product.findUnique({ where: { id: req.params.id, deletedAt: null } });
            if (!existing) throw new Error("Product not found");

            const deleted = await tx.product.update({
                where: { id: req.params.id },
                data: { deletedAt: new Date() }
            });

            await auditService.logEvent(tx, {
                tenantId: req.user!.tenantId,
                userId: req.user!.userId,
                entityType: 'Product',
                entityId: deleted.id,
                operation: 'DELETE',
                beforeState: existing,
                afterState: deleted,
                auditMeta: (req as any).auditMeta
            });
            return deleted;
        });
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete product" });
    }
});

export default router;
