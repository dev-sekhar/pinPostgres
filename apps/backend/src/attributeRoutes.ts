import { Router } from "express";
import { prisma, withTenantTransaction } from "./prismaClient.js";
import { requireAuth, AuthRequest } from "./authMiddleware.js";
import { requirePermission } from "./rbacMiddleware.js";

const router = Router();
router.use(requireAuth as any);

// GET /api/attributes
router.get("/", requirePermission("attribute.read") as any, async (req: AuthRequest, res) => {
    try {
        const attributes = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.attributeDefinition.findMany({
                where: { deletedAt: null },
                orderBy: { createdAt: "desc" }
            });
        });
        res.json(attributes);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch attributes" });
    }
});

// GET /api/attributes/:id
router.get("/:id", requirePermission("attribute.read") as any, async (req: AuthRequest, res) => {
    try {
        const attribute = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.attributeDefinition.findUnique({
                where: { id: req.params.id, deletedAt: null }
            });
        });
        if (!attribute) return res.status(404).json({ error: "Attribute not found" });
        res.json(attribute);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch attribute" });
    }
});

// POST /api/attributes
router.post("/", requirePermission("attribute.create") as any, async (req: AuthRequest, res) => {
    const { code, name, type, isRequired, options, productFamilyId } = req.body;
    if (!code || !name || !type || !productFamilyId) {
        return res.status(400).json({ error: "Missing required fields (code, name, type, productFamilyId)" });
    }
    if (!/^[a-z0-9_]+$/.test(code)) {
        return res.status(400).json({ error: "Code must be lowercase alphanumeric and underscores only" });
    }
    if ((type === 'SELECT' || type === 'MULTI_SELECT') && (!options || !Array.isArray(options) || options.length === 0)) {
        return res.status(400).json({ error: "Options array is required for SELECT types" });
    }
    try {
        const attribute = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.attributeDefinition.create({
                data: {
                    code, name, type, isRequired, options, productFamilyId,
                    tenantId: req.user!.tenantId
                }
            });
        });
        res.status(201).json(attribute);
    } catch (error) {
        res.status(500).json({ error: "Failed to create attribute" });
    }
});

// PUT /api/attributes/:id
router.put("/:id", requirePermission("attribute.update") as any, async (req: AuthRequest, res) => {
    const { code, name, type, isRequired, options, productFamilyId } = req.body;
    if (!code || !name || !type || !productFamilyId) {
        return res.status(400).json({ error: "Missing required fields (code, name, type, productFamilyId)" });
    }
    if (!/^[a-z0-9_]+$/.test(code)) {
        return res.status(400).json({ error: "Code must be lowercase alphanumeric and underscores only" });
    }
    if ((type === 'SELECT' || type === 'MULTI_SELECT') && (!options || !Array.isArray(options) || options.length === 0)) {
        return res.status(400).json({ error: "Options array is required for SELECT types" });
    }
    try {
        const attribute = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const existing = await tx.attributeDefinition.findUnique({
                where: { id: req.params.id, deletedAt: null }
            });
            if (!existing) throw new Error("NOT_FOUND");

            const productsInUse: any = await tx.$queryRawUnsafe(`SELECT id FROM "Product" WHERE "deletedAt" IS NULL AND "attributes"->>'${existing.code}' IS NOT NULL LIMIT 1`);
            if (Array.isArray(productsInUse) && productsInUse.length > 0) {
                throw new Error("IN_USE");
            }

            return tx.attributeDefinition.update({
                where: { id: req.params.id, deletedAt: null },
                data: { code, name, type, isRequired, options, productFamilyId }
            });
        });
        res.json(attribute);
    } catch (error: any) {
        if (error.message === "NOT_FOUND") return res.status(404).json({ error: "Attribute not found" });
        if (error.message === "IN_USE") return res.status(400).json({ error: "Cannot edit attribute because it is already used by products or variants" });
        res.status(500).json({ error: "Failed to update attribute" });
    }
});

// PATCH /api/attributes/:id
router.patch("/:id", requirePermission("attribute.update") as any, async (req: AuthRequest, res) => {
    try {
        const attribute = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.attributeDefinition.update({
                where: { id: req.params.id, deletedAt: null },
                data: req.body
            });
        });
        res.json(attribute);
    } catch (error) {
        res.status(500).json({ error: "Failed to update attribute" });
    }
});

// DELETE /api/attributes/:id (Soft Delete)
router.delete("/:id", requirePermission("attribute.delete") as any, async (req: AuthRequest, res) => {
    try {
        await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.attributeDefinition.update({
                where: { id: req.params.id, deletedAt: null },
                data: { deletedAt: new Date() }
            });
        });
        res.json({ message: "Attribute deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete attribute" });
    }
});

export default router;
