import { Router } from "express";
import { requireAuth, AuthRequest } from "./authMiddleware.js";
import { requirePermission } from "./rbacMiddleware.js";
import { complianceTypeService } from "./services/complianceTypeService.js";

const router = Router();
router.use(requireAuth as any);

router.get("/", requirePermission("complianceType.read") as any, async (req: AuthRequest, res) => {
    try {
        const items = await complianceTypeService.getComplianceTypes();
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/:id", requirePermission("complianceType.read") as any, async (req: AuthRequest, res) => {
    try {
        const item = await complianceTypeService.getComplianceTypeById(req.params.id);
        if (!item) return res.status(404).json({ error: "Not found" });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/", requirePermission("complianceType.create") as any, async (req: AuthRequest, res) => {
    try {
        const item = await complianceTypeService.createComplianceType(req.user!.tenantId, req.user!.userId, req.body, (req as any).auditMeta);
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

router.put("/:id", requirePermission("complianceType.update") as any, async (req: AuthRequest, res) => {
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

export default router;
