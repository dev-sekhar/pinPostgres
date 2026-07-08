import { Router } from "express";
import { validateSchema } from "../middleware/schemaValidation.js";
import { requireAuth, AuthRequest } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/rbacMiddleware.js";
import { complianceTypeService } from "../services/complianceTypeService.js";

const router = Router();
router.use(requireAuth as any);

router.get("/", requirePermission("complianceType.read") as any, async (req: AuthRequest, res) => {
    const items = await complianceTypeService.getComplianceTypes();
    res.json(items);
});

router.get("/:id", requirePermission("complianceType.read") as any, async (req: AuthRequest, res) => {
    const item = await complianceTypeService.getComplianceTypeById(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
});

router.post("/", requirePermission("complianceType.create") as any, validateSchema("ComplianceType") as any, async (req: AuthRequest, res) => {
    const item = await complianceTypeService.createComplianceType(req.user!.tenantId, req.user!.userId, req.body, (req as any).auditMeta);
    res.status(201).json(item);
});

router.put("/:id", requirePermission("complianceType.update") as any, validateSchema("ComplianceType") as any, async (req: AuthRequest, res) => {
    delete req.body.status; // Prevent status update via generic endpoint
    try {
        const item = await complianceTypeService.updateComplianceType(req.user!.tenantId, req.user!.userId, req.params.id, req.body, (req as any).auditMeta);
        res.json(item);
    } catch (error: any) {
        if (error.message === "ComplianceType not found") return res.status(404).json({ error: "Not found" });
        res.status(500).json({ error: "Internal server error" });
    }
});

router.delete("/:id", requirePermission("complianceType.delete") as any, async (req: AuthRequest, res) => {
    try {
        const item = await complianceTypeService.deleteComplianceType(req.user!.tenantId, req.user!.userId, req.params.id, (req as any).auditMeta);
        res.json(item);
    } catch (error: any) {
        if (error.message === "ComplianceType not found") return res.status(404).json({ error: "Not found" });
        res.status(500).json({ error: "Internal server error" });
    }
});


// PATCH /api/complianceTypes/:id/status
router.patch("/:id/status", requirePermission("complianceType.status.update") as any, async (req: AuthRequest, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required" });

    try {
        const updated = await complianceTypeService.updateComplianceType(
            req.user!.tenantId,
            req.user!.userId,
            req.params.id,
            { status },
            (req as any).auditMeta
        );
        if (!updated) return res.status(404).json({ error: "complianceType not found" });
        res.json(updated);
    } catch (error: any) {
        console.error("Error updating complianceType status:", error);
        res.status(500).json({ error: "Failed to update complianceType status" });
    }
});

export default router;
