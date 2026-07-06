import { Router } from "express";
import { prisma, withTenantTransaction } from "./prismaClient.js";
import { requireAuth, AuthRequest } from "./authMiddleware.js";
import { requirePermission } from "./rbacMiddleware.js";
import { auditService } from "./services/auditService.js";

const router = Router();
router.use(requireAuth as any);

// GET /api/categories
router.get("/", async (req: AuthRequest, res) => {
    try {
        const categories = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.category.findMany({
                where: { deletedAt: null },
                orderBy: { name: "asc" }
            });
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch categories" });
    }
});

// GET /api/categories/:id
router.get("/:id", async (req: AuthRequest, res) => {
    try {
        const category = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.category.findUnique({
                where: { id: req.params.id, deletedAt: null },
                include: { 
                    children: { where: { deletedAt: null } },
                    productFamilies: { where: { deletedAt: null } }
                }
            });
        });
        if (!category) return res.status(404).json({ error: "Category not found" });
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch category" });
    }
});

// POST /api/categories
router.post("/", requirePermission("category.create") as any, async (req: AuthRequest, res) => {
    const { name, description, domainId, parentId } = req.body;
    if (!name || !domainId) return res.status(400).json({ error: "Name and domainId are required" });
    try {
        const category = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const newCategory = await tx.category.create({
                data: { name: name.trim(), description, domainId, parentId, tenantId: req.user!.tenantId }
            });
            await auditService.logEvent(tx, {
                tenantId: req.user!.tenantId,
                userId: req.user!.userId,
                entityType: 'Category',
                entityId: newCategory.id,
                operation: 'CREATE',
                afterState: newCategory,
                auditMeta: (req as any).auditMeta
            });
            return newCategory;
        });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ error: "Failed to create category" });
    }
});

// PUT /api/categories/:id
router.put("/:id", requirePermission("category.update") as any, async (req: AuthRequest, res) => {
    const { name, description, parentId } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    try {
        const category = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.category.update({
                where: { id: req.params.id, deletedAt: null },
                data: { name: name.trim(), description, parentId }
            });
        });
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: "Failed to update category" });
    }
});

// DELETE /api/categories/:id
router.delete("/:id", requirePermission("category.delete") as any, async (req: AuthRequest, res) => {
    try {
        await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.category.update({
                where: { id: req.params.id, deletedAt: null },
                data: { deletedAt: new Date() }
            });
        });
        res.json({ message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete category" });
    }
});

export default router;
