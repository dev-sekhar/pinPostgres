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

// GET /api/media/product/:productId
router.get("/product/:productId", async (req: AuthRequest, res) => {
    try {
        const [_, media] = await withTenant(req.user!.tenantId,
            prisma.productMedia.findMany({
                where: { productId: req.params.productId, deletedAt: null },
                orderBy: { sortOrder: "asc" }
            })
        );
        res.json(media);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch media" });
    }
});

// GET /api/media/:id
router.get("/:id", async (req: AuthRequest, res) => {
    try {
        const [_, media] = await withTenant(req.user!.tenantId,
            prisma.productMedia.findUnique({
                where: { id: req.params.id, deletedAt: null }
            })
        );
        if (!media) return res.status(404).json({ error: "Media not found" });
        res.json(media);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch media" });
    }
});

// POST /api/media
router.post("/", async (req: AuthRequest, res) => {
    const { url, altText, sortOrder, productId } = req.body;
    if (!url || !productId) {
        return res.status(400).json({ error: "Missing required fields (url, productId)" });
    }
    try {
        const [_, media] = await withTenant(req.user!.tenantId,
            prisma.productMedia.create({
                data: {
                    url, altText, sortOrder: sortOrder || 0, productId,
                    tenantId: req.user!.tenantId
                }
            })
        );
        res.status(201).json(media);
    } catch (error) {
        res.status(500).json({ error: "Failed to create media record" });
    }
});

// PUT /api/media/:id
router.put("/:id", async (req: AuthRequest, res) => {
    const { url, altText, sortOrder, productId } = req.body;
    if (!url || !productId) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        const [_, media] = await withTenant(req.user!.tenantId,
            prisma.productMedia.update({
                where: { id: req.params.id, deletedAt: null },
                data: { url, altText, sortOrder, productId }
            })
        );
        res.json(media);
    } catch (error) {
        res.status(500).json({ error: "Failed to update media record" });
    }
});

// PATCH /api/media/:id
router.patch("/:id", async (req: AuthRequest, res) => {
    try {
        const [_, media] = await withTenant(req.user!.tenantId,
            prisma.productMedia.update({
                where: { id: req.params.id, deletedAt: null },
                data: req.body
            })
        );
        res.json(media);
    } catch (error) {
        res.status(500).json({ error: "Failed to update media record" });
    }
});

// DELETE /api/media/:id (Soft Delete)
router.delete("/:id", async (req: AuthRequest, res) => {
    try {
        const [_, media] = await withTenant(req.user!.tenantId,
            prisma.productMedia.update({
                where: { id: req.params.id, deletedAt: null },
                data: { deletedAt: new Date() }
            })
        );
        res.json({ message: "Media deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete media" });
    }
});

export default router;
