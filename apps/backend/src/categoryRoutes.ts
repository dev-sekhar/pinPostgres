import { Router } from "express";
import { prisma, withTenantTransaction } from "./prismaClient.js";
import { requireAuth, AuthRequest } from "./authMiddleware.js";
import { requirePermission } from "./rbacMiddleware.js";
import { auditService } from "./services/auditService.js";

const router = Router();
router.use(requireAuth as any);

// GET /api/categories
router.get("/", async (req: AuthRequest, res) => {
    const categories = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.category.findMany({
                where: { deletedAt: null },
                orderBy: { name: "asc" }
            });
        });
        res.json(categories);
});

// GET /api/categories/:id
router.get("/:id", async (req: AuthRequest, res) => {
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
});

// POST /api/categories
router.post("/", requirePermission("category.create") as any, async (req: AuthRequest, res) => {
    const { name, description, domainId, parentId } = req.body;
    if (!name || !domainId) return res.status(400).json({ error: "Name and domainId are required" });
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
});

// PUT /api/categories/:id
router.put("/:id", requirePermission("category.update") as any, async (req: AuthRequest, res) => {
    const { name, description, parentId } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    const category = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const existing = await tx.category.findUnique({ where: { id: req.params.id, deletedAt: null } });
            if (!existing) throw new Error("Category not found");

            const updated = await tx.category.update({
                where: { id: req.params.id },
                data: { name: name.trim(), description, parentId }
            });

            await auditService.logEvent(tx, {
                tenantId: req.user!.tenantId,
                userId: req.user!.userId,
                entityType: 'Category',
                entityId: updated.id,
                operation: 'UPDATE',
                beforeState: existing,
                afterState: updated,
                auditMeta: (req as any).auditMeta
            });
            return updated;
        });
        res.json(category);
});

// DELETE /api/categories/:id
router.delete("/:id", requirePermission("category.delete") as any, async (req: AuthRequest, res) => {
    await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const existing = await tx.category.findUnique({ where: { id: req.params.id, deletedAt: null } });
            if (!existing) throw new Error("Category not found");

            const deleted = await tx.category.update({
                where: { id: req.params.id },
                data: { deletedAt: new Date() }
            });

            await auditService.logEvent(tx, {
                tenantId: req.user!.tenantId,
                userId: req.user!.userId,
                entityType: 'Category',
                entityId: deleted.id,
                operation: 'DELETE',
                beforeState: existing,
                afterState: deleted,
                auditMeta: (req as any).auditMeta
            });
            return deleted;
        });
        res.json({ message: "Category deleted successfully" });
});

export default router;
