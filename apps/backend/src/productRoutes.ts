import { Router } from "express";
import { prisma, withTenantTransaction } from "./prismaClient.js";
import { requireAuth, AuthRequest } from "./authMiddleware.js";
import { auditService } from "./services/auditService.js";

const router = Router();

router.use(requireAuth as any);
// GET /api/products
router.get("/", async (req: AuthRequest, res) => {
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
router.get("/:id", async (req: AuthRequest, res) => {
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
router.post("/", async (req: AuthRequest, res) => {
    const { sku, name, description, price, parentId, attributes } = req.body;
    if (!sku || !name || price === undefined) {
        return res.status(400).json({ error: "Missing required fields (sku, name, price)" });
    }
    try {
        const product = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const newProduct = await tx.product.create({
                data: { sku, name, description, price, parentId, attributes, tenantId: req.user!.tenantId }
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
router.put("/:id", async (req: AuthRequest, res) => {
    const { sku, name, description, price, attributes } = req.body;
    if (!sku || !name || price === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        const product = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.product.update({
                where: { id: req.params.id, deletedAt: null },
                data: { sku, name, description, price, attributes }
            });
        });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: "Failed to update product" });
    }
});

// PATCH /api/products/:id
router.patch("/:id", async (req: AuthRequest, res) => {
    try {
        const product = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.product.update({
                where: { id: req.params.id, deletedAt: null },
                data: req.body
            });
        });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: "Failed to update product" });
    }
});

// DELETE /api/products/:id (Soft Delete)
router.delete("/:id", async (req: AuthRequest, res) => {
    try {
        await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.product.update({
                where: { id: req.params.id, deletedAt: null },
                data: { deletedAt: new Date() }
            });
        });
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete product" });
    }
});

export default router;
