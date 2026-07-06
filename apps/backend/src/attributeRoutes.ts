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

// GET /api/attributes
router.get("/", async (req: AuthRequest, res) => {
    try {
        const [_, attributes] = await withTenant(req.user!.tenantId,
            prisma.attributeDefinition.findMany({
                where: { deletedAt: null },
                orderBy: { createdAt: "desc" }
            })
        );
        res.json(attributes);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch attributes" });
    }
});

// GET /api/attributes/:id
router.get("/:id", async (req: AuthRequest, res) => {
    try {
        const [_, attribute] = await withTenant(req.user!.tenantId,
            prisma.attributeDefinition.findUnique({
                where: { id: req.params.id, deletedAt: null }
            })
        );
        if (!attribute) return res.status(404).json({ error: "Attribute not found" });
        res.json(attribute);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch attribute" });
    }
});

// POST /api/attributes
router.post("/", async (req: AuthRequest, res) => {
    const { code, name, type, isRequired, options } = req.body;
    if (!code || !name || !type) {
        return res.status(400).json({ error: "Missing required fields (code, name, type)" });
    }
    if (!/^[a-z0-9_]+$/.test(code)) {
        return res.status(400).json({ error: "Code must be lowercase alphanumeric and underscores only" });
    }
    if ((type === 'SELECT' || type === 'MULTI_SELECT') && (!options || !Array.isArray(options) || options.length === 0)) {
        return res.status(400).json({ error: "Options array is required for SELECT types" });
    }
    try {
        const [_, attribute] = await withTenant(req.user!.tenantId,
            prisma.attributeDefinition.create({
                data: {
                    code, name, type, isRequired, options,
                    tenantId: req.user!.tenantId
                }
            })
        );
        res.status(201).json(attribute);
    } catch (error) {
        res.status(500).json({ error: "Failed to create attribute" });
    }
});

// PUT /api/attributes/:id
router.put("/:id", async (req: AuthRequest, res) => {
    const { code, name, type, isRequired, options } = req.body;
    if (!code || !name || !type) {
        return res.status(400).json({ error: "Missing required fields (code, name, type)" });
    }
    if (!/^[a-z0-9_]+$/.test(code)) {
        return res.status(400).json({ error: "Code must be lowercase alphanumeric and underscores only" });
    }
    if ((type === 'SELECT' || type === 'MULTI_SELECT') && (!options || !Array.isArray(options) || options.length === 0)) {
        return res.status(400).json({ error: "Options array is required for SELECT types" });
    }
    try {
        // Fetch existing attribute to check its code
        const [_, existing] = await withTenant(req.user!.tenantId,
            prisma.attributeDefinition.findUnique({
                where: { id: req.params.id, deletedAt: null }
            })
        );
        if (!existing) return res.status(404).json({ error: "Attribute not found" });

        // Check if any product uses this attribute
        const [__, productsInUse] = await withTenant(req.user!.tenantId,
            prisma.$queryRawUnsafe(`SELECT id FROM "Product" WHERE "deletedAt" IS NULL AND "attributes"->>'${existing.code}' IS NOT NULL LIMIT 1`)
        );
        if (Array.isArray(productsInUse) && productsInUse.length > 0) {
            return res.status(400).json({ error: "Cannot edit attribute because it is already used by products or variants" });
        }

        const [___, attribute] = await withTenant(req.user!.tenantId,
            prisma.attributeDefinition.update({
                where: { id: req.params.id, deletedAt: null },
                data: { code, name, type, isRequired, options }
            })
        );
        res.json(attribute);
    } catch (error) {
        res.status(500).json({ error: "Failed to update attribute" });
    }
});

// PATCH /api/attributes/:id
router.patch("/:id", async (req: AuthRequest, res) => {
    try {
        const [_, attribute] = await withTenant(req.user!.tenantId,
            prisma.attributeDefinition.update({
                where: { id: req.params.id, deletedAt: null },
                data: req.body
            })
        );
        res.json(attribute);
    } catch (error) {
        res.status(500).json({ error: "Failed to update attribute" });
    }
});

// DELETE /api/attributes/:id (Soft Delete)
router.delete("/:id", async (req: AuthRequest, res) => {
    try {
        const [_, attribute] = await withTenant(req.user!.tenantId,
            prisma.attributeDefinition.update({
                where: { id: req.params.id, deletedAt: null },
                data: { deletedAt: new Date() }
            })
        );
        res.json({ message: "Attribute deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete attribute" });
    }
});

export default router;
