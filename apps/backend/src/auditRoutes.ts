import { Router } from "express";
import { prisma, withTenantTransaction } from "./prismaClient.js";
import { requireAuth, AuthRequest } from "./authMiddleware.js";
import { requirePermission } from "./rbacMiddleware.js";

const router = Router();
router.use(requireAuth as any);

// GET /api/audit
// Fetch audit trail logs for the current tenant.
// Taking top 100 for this implementation.
router.get("/", requirePermission("audit.read") as any, async (req: AuthRequest, res) => {
    const auditLogs = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.auditLog.findMany({
                where: { tenantId: req.user!.tenantId },
                orderBy: { createdAt: "desc" },
                take: 100,
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            });
        });
        res.json(auditLogs);
});

export default router;
