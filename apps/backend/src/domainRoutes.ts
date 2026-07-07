import { Router } from "express";
import { prisma, withTenantTransaction } from "./prismaClient.js";
import { requireAuth, AuthRequest } from "./authMiddleware.js";
import { requirePermission } from "./rbacMiddleware.js";
import { auditService } from "./services/auditService.js";

const router = Router();
router.use(requireAuth as any);

// GET /api/domains
router.get("/", async (req: AuthRequest, res) => {
    try {
        const domains = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.domain.findMany({
                where: { deletedAt: null },
                orderBy: { name: "asc" }
            });
        });
        res.json(domains);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch domains" });
    }
});

// GET /api/domains/:id
router.get("/:id", async (req: AuthRequest, res) => {
    try {
        const domain = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.domain.findUnique({
                where: { id: req.params.id, deletedAt: null },
                include: { categories: { where: { deletedAt: null, parentId: null } } }
            });
        });
        if (!domain) return res.status(404).json({ error: "Domain not found" });
        res.json(domain);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch domain" });
    }
});

// POST /api/domains
router.post("/", requirePermission("domain.create") as any, async (req: AuthRequest, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    try {
        const domain = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const newDomain = await tx.domain.create({
                data: { name: name.trim(), description, tenantId: req.user!.tenantId }
            });
            await auditService.logEvent(tx, {
                tenantId: req.user!.tenantId,
                userId: req.user!.userId,
                entityType: 'Domain',
                entityId: newDomain.id,
                operation: 'CREATE',
                afterState: newDomain,
                auditMeta: (req as any).auditMeta
            });
            return newDomain;
        });
        res.status(201).json(domain);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create domain" });
    }
});

// PUT /api/domains/:id
router.put("/:id", requirePermission("domain.update") as any, async (req: AuthRequest, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    try {
        const domain = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const existing = await tx.domain.findUnique({ where: { id: req.params.id, deletedAt: null } });
            if (!existing) throw new Error("Domain not found");

            const updated = await tx.domain.update({
                where: { id: req.params.id },
                data: { name: name.trim(), description }
            });

            await auditService.logEvent(tx, {
                tenantId: req.user!.tenantId,
                userId: req.user!.userId,
                entityType: 'Domain',
                entityId: updated.id,
                operation: 'UPDATE',
                beforeState: existing,
                afterState: updated,
                changedFields: req.body,
                auditMeta: (req as any).auditMeta
            });
            return updated;
        });
        res.json(domain);
    } catch (error) {
        res.status(500).json({ error: "Failed to update domain" });
    }
});

// DELETE /api/domains/:id
router.delete("/:id", requirePermission("domain.delete") as any, async (req: AuthRequest, res) => {
    try {
        await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const existing = await tx.domain.findUnique({ where: { id: req.params.id, deletedAt: null } });
            if (!existing) throw new Error("Domain not found");

            const deleted = await tx.domain.update({
                where: { id: req.params.id },
                data: { deletedAt: new Date() }
            });

            await auditService.logEvent(tx, {
                tenantId: req.user!.tenantId,
                userId: req.user!.userId,
                entityType: 'Domain',
                entityId: deleted.id,
                operation: 'DELETE',
                beforeState: existing,
                afterState: deleted,
                auditMeta: (req as any).auditMeta
            });
            return deleted;
        });
        res.json({ message: "Domain deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete domain" });
    }
});

export default router;
