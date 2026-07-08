import { Router } from "express";
import { validateSchema } from "../middleware/schemaValidation.js";
import { prisma, withTenantTransaction } from "../prismaClient.js";
import { requireAuth, AuthRequest } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/rbacMiddleware.js";
import { brandService } from "../services/brandService.js";


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
router.post("/", requirePermission("brand.create") as any, validateSchema("Brand") as any, async (req: AuthRequest, res) => {
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
router.put("/:id", requirePermission("brand.update") as any, validateSchema("Brand") as any, async (req: AuthRequest, res) => {
    delete req.body.status; // Prevent status update via generic endpoint
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
    delete req.body.status; // Prevent status update via generic endpoint
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


// PATCH /api/brands/:id/status
router.patch("/:id/status", requirePermission("brand.status.update") as any, async (req: AuthRequest, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required" });

    try {
        const updated = await brandService.updateBrand(
            req.user!.tenantId,
            req.user!.userId,
            req.params.id,
            { status },
            (req as any).auditMeta
        );
        if (!updated) return res.status(404).json({ error: "brand not found" });
        res.json(updated);
    } catch (error: any) {
        console.error("Error updating brand status:", error);
        res.status(500).json({ error: "Failed to update brand status" });
    }
});

export default router;
