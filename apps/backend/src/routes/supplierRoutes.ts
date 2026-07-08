import { Router } from "express";
import { validateSchema } from "../middleware/schemaValidation.js";
import { requireAuth, AuthRequest } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/rbacMiddleware.js";
import { supplierService } from "../services/supplierService.js";

const router = Router();
router.use(requireAuth as any);

router.get("/", requirePermission("supplier.read") as any, async (req: AuthRequest, res) => {
    const items = await supplierService.getSuppliers(req.user!.tenantId);
    res.json(items);
});

router.get("/:id", requirePermission("supplier.read") as any, async (req: AuthRequest, res) => {
    const item = await supplierService.getSupplierById(req.user!.tenantId, req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
});

router.post("/", requirePermission("supplier.create") as any, validateSchema("Supplier") as any, async (req: AuthRequest, res) => {
    const item = await supplierService.createSupplier(req.user!.tenantId, req.user!.userId, req.body, (req as any).auditMeta);
    res.status(201).json(item);
});

router.put("/:id", requirePermission("supplier.update") as any, validateSchema("Supplier") as any, async (req: AuthRequest, res) => {
    delete req.body.status; // Prevent status update via generic endpoint
    try {
        const item = await supplierService.updateSupplier(req.user!.tenantId, req.user!.userId, req.params.id, req.body, (req as any).auditMeta);
        res.json(item);
    } catch (error: any) {
        if (error.message === "Supplier not found") return res.status(404).json({ error: "Not found" });
        res.status(500).json({ error: "Internal server error" });
    }
});

router.delete("/:id", requirePermission("supplier.delete") as any, async (req: AuthRequest, res) => {
    try {
        const item = await supplierService.deleteSupplier(req.user!.tenantId, req.user!.userId, req.params.id, (req as any).auditMeta);
        res.json(item);
    } catch (error: any) {
        if (error.message === "Supplier not found") return res.status(404).json({ error: "Not found" });
        res.status(500).json({ error: "Internal server error" });
    }
});


// PATCH /api/suppliers/:id/status
router.patch("/:id/status", requirePermission("supplier.status.update") as any, async (req: AuthRequest, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required" });

    try {
        const updated = await supplierService.updateSupplier(
            req.user!.tenantId,
            req.user!.userId,
            req.params.id,
            { status },
            (req as any).auditMeta
        );
        if (!updated) return res.status(404).json({ error: "supplier not found" });
        res.json(updated);
    } catch (error: any) {
        console.error("Error updating supplier status:", error);
        res.status(500).json({ error: "Failed to update supplier status" });
    }
});

export default router;
