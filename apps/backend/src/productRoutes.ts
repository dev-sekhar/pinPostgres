import { Router } from "express";
import { prisma } from "./prismaClient.js";
import { requireAuth, AuthRequest } from "./authMiddleware.js";

const router = Router();

router.use(requireAuth as any);

const withTenant = async (tenantId: string, operation: any) => {
    return prisma.$transaction([
        prisma.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`,
        operation
    ]);
};

// GET /api/products
router.get("/", async (req: AuthRequest, res) => {
    try {
        const [_, products] = await withTenant(req.user!.tenantId, 
            prisma.product.findMany({
                where: { deletedAt: null, parentId: null },
                take: 50,
                orderBy: { createdAt: "desc" },
            })
        );
        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/products/:id
router.get("/:id", async (req: AuthRequest, res) => {
    try {
        const [_, product] = await withTenant(req.user!.tenantId,
            prisma.product.findUnique({
                where: { id: req.params.id, deletedAt: null },
                include: { variants: { where: { deletedAt: null } } }
            })
        );
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
        const [_, product] = await withTenant(req.user!.tenantId,
            prisma.product.create({
                data: { sku, name, description, price, parentId, attributes, tenantId: req.user!.tenantId }
            })
        );
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
        const [_, product] = await withTenant(req.user!.tenantId,
            prisma.product.update({
                where: { id: req.params.id, deletedAt: null },
                data: { sku, name, description, price, attributes }
            })
        );
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: "Failed to update product" });
    }
});

// PATCH /api/products/:id
router.patch("/:id", async (req: AuthRequest, res) => {
    try {
        const [_, product] = await withTenant(req.user!.tenantId,
            prisma.product.update({
                where: { id: req.params.id, deletedAt: null },
                data: req.body
            })
        );
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: "Failed to update product" });
    }
});

// DELETE /api/products/:id (Soft Delete)
router.delete("/:id", async (req: AuthRequest, res) => {
    try {
        const [_, product] = await withTenant(req.user!.tenantId,
            prisma.product.update({
                where: { id: req.params.id, deletedAt: null },
                data: { deletedAt: new Date() }
            })
        );
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete product" });
    }
});

export default router;
