import { Router } from "express";
import { prisma, withTenantTransaction } from "./prismaClient.js";
import { requireAuth, AuthRequest } from "./authMiddleware.js";
import { requirePermission } from "./rbacMiddleware.js";
import { brandService } from "./services/brandService.js";
import { validateBrandInput } from "./validations/brandValidation.js";

const router = Router();
router.use(requireAuth as any);

// GET /api/brands
router.get("/", requirePermission("brand.read") as any, async (req: AuthRequest, res) => {
    const brands = await withTenantTransaction(req.user!.tenantId, async (tx) => {
                return tx.brand.findMany({
                    where: { deletedAt: null },
                    orderBy: { name: "asc" }
                });
            });
    res.json(brands);
});

// GET /api/brands/:id
router.get("/:id", requirePermission("brand.read") as any, async (req: AuthRequest, res) => {
    const brand = await withTenantTransaction(req.user!.tenantId, async (tx) => {
                return tx.brand.findUnique({
                    where: { id: req.params.id, deletedAt: null }
                });
            });
    if (!brand) return res.status(404).json({ error: "Brand not found" });
    res.json(brand);
});

// POST /api/brands
router.post("/", requirePermission("brand.create") as any, async (req: AuthRequest, res) => {
    const validation = validateBrandInput(req.body);
    if (!validation.isValid) {
        return res.status(400).json({ error: "Validation failed", details: validation.errors });
    }
    try {
        const brand = await brandService.createBrand(
            req.user!.tenantId,
            req.user!.userId,
            req.body,
            (req as any).auditMeta
        );
        res.status(201).json(brand);
    } catch (error: any) {
        console.error("Error creating brand:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Brand code already exists" });
        }
        res.status(500).json({ error: "Failed to create brand" });
    }
});

// PUT /api/brands/:id
router.put("/:id", requirePermission("brand.update") as any, async (req: AuthRequest, res) => {
    // Treat PUT as full update, so we validate as normal (require name & code)
    const validation = validateBrandInput(req.body);
    if (!validation.isValid) {
        return res.status(400).json({ error: "Validation failed", details: validation.errors });
    }
    try {
        const brand = await brandService.updateBrand(
            req.user!.tenantId,
            req.user!.userId,
            req.params.id,
            req.body,
            (req as any).auditMeta
        );
        if (!brand) return res.status(404).json({ error: "Brand not found" });
        res.json(brand);
    } catch (error: any) {
        console.error("Error updating brand:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Brand code already exists" });
        }
        res.status(500).json({ error: "Failed to update brand" });
    }
});

// PATCH /api/brands/:id
router.patch("/:id", requirePermission("brand.update") as any, async (req: AuthRequest, res) => {
    const validation = validateBrandInput(req.body, true); // true for partial update
    if (!validation.isValid) {
        return res.status(400).json({ error: "Validation failed", details: validation.errors });
    }
    try {
        const brand = await brandService.updateBrand(
            req.user!.tenantId,
            req.user!.userId,
            req.params.id,
            req.body,
            (req as any).auditMeta
        );
        if (!brand) return res.status(404).json({ error: "Brand not found" });
        res.json(brand);
    } catch (error: any) {
        console.error("Error patching brand:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Brand code already exists" });
        }
        res.status(500).json({ error: "Failed to update brand" });
    }
});

// DELETE /api/brands/:id
router.delete("/:id", requirePermission("brand.delete") as any, async (req: AuthRequest, res) => {
    const brand = await brandService.deleteBrand(
                req.user!.tenantId,
                req.user!.userId,
                req.params.id,
                (req as any).auditMeta
            );
    if (!brand) return res.status(404).json({ error: "Brand not found" });
    res.json({ message: "Brand deleted successfully" });
});

export default router;
