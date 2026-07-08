import { Router } from "express";
import { requireAuth, AuthRequest } from "./authMiddleware.js";
import { requirePermission } from "./rbacMiddleware.js";
import { manufacturerService } from "./services/manufacturerService.js";

const router = Router();
router.use(requireAuth as any);

router.get("/", requirePermission("manufacturer.read") as any, async (req: AuthRequest, res) => {
    const items = await manufacturerService.getManufacturers();
    res.json(items);
});

router.get("/:id", requirePermission("manufacturer.read") as any, async (req: AuthRequest, res) => {
    const item = await manufacturerService.getManufacturerById(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
});

router.post("/", requirePermission("manufacturer.create") as any, async (req: AuthRequest, res) => {
    const item = await manufacturerService.createManufacturer(req.user!.tenantId, req.user!.userId, req.body, (req as any).auditMeta);
    res.status(201).json(item);
});

router.put("/:id", requirePermission("manufacturer.update") as any, async (req: AuthRequest, res) => {
    delete req.body.status; // Prevent status update via generic endpoint
    try {
        const item = await manufacturerService.updateManufacturer(req.user!.tenantId, req.user!.userId, req.params.id, req.body, (req as any).auditMeta);
        res.json(item);
    } catch (error: any) {
        if (error.message === "Manufacturer not found") return res.status(404).json({ error: "Not found" });
        res.status(500).json({ error: "Internal server error" });
    }
});

router.delete("/:id", requirePermission("manufacturer.delete") as any, async (req: AuthRequest, res) => {
    try {
        const item = await manufacturerService.deleteManufacturer(req.user!.tenantId, req.user!.userId, req.params.id, (req as any).auditMeta);
        res.json(item);
    } catch (error: any) {
        if (error.message === "Manufacturer not found") return res.status(404).json({ error: "Not found" });
        res.status(500).json({ error: "Internal server error" });
    }
});


// PATCH /api/manufacturers/:id/status
router.patch("/:id/status", requirePermission("manufacturer.status.update") as any, async (req: AuthRequest, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required" });

    try {
        const updated = await manufacturerService.updateManufacturer(
            req.user!.tenantId,
            req.user!.userId,
            req.params.id,
            { status },
            (req as any).auditMeta
        );
        if (!updated) return res.status(404).json({ error: "manufacturer not found" });
        res.json(updated);
    } catch (error: any) {
        console.error("Error updating manufacturer status:", error);
        res.status(500).json({ error: "Failed to update manufacturer status" });
    }
});

export default router;
