import { Router } from "express";
import { requireAuth, AuthRequest } from "./authMiddleware.js";
import { requirePermission } from "./rbacMiddleware.js";
import { supplierService } from "./services/supplierService.js";

const router = Router();
router.use(requireAuth as any);

router.get("/", requirePermission("supplier.read") as any, async (req: AuthRequest, res) => {
    try {
        const items = await supplierService.getSuppliers(req.user!.tenantId);
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/:id", requirePermission("supplier.read") as any, async (req: AuthRequest, res) => {
    try {
        const item = await supplierService.getSupplierById(req.user!.tenantId, req.params.id);
        if (!item) return res.status(404).json({ error: "Not found" });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/", requirePermission("supplier.create") as any, async (req: AuthRequest, res) => {
    try {
        const item = await supplierService.createSupplier(req.user!.tenantId, req.user!.userId, req.body, (req as any).auditMeta);
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

router.put("/:id", requirePermission("supplier.update") as any, async (req: AuthRequest, res) => {
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

export default router;
