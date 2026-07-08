import { Router } from "express";
import { prisma, withTenantTransaction } from "../prismaClient.js";
import { requireAuth, AuthRequest } from "../middleware/authMiddleware.js";

const router = Router();
router.use(requireAuth as any);

// GET /api/media/product/:productId
router.get("/product/:productId", async (req: AuthRequest, res) => {
    const media = await withTenantTransaction(req.user!.tenantId, async (tx) => {
                return tx.productMedia.findMany({
                    where: { productId: req.params.productId, deletedAt: null },
                    orderBy: { sortOrder: "asc" }
                });
            });
    res.json(media);
});

// GET /api/media/:id
router.get("/:id", async (req: AuthRequest, res) => {
    const media = await withTenantTransaction(req.user!.tenantId, async (tx) => {
                return tx.productMedia.findUnique({
                    where: { id: req.params.id, deletedAt: null }
                });
            });
    if (!media) return res.status(404).json({ error: "Media not found" });
    res.json(media);
});

// POST /api/media
router.post("/", async (req: AuthRequest, res) => {
    const { url, altText, sortOrder, productId } = req.body;
    if (!url || !productId) {
        return res.status(400).json({ error: "Missing required fields (url, productId)" });
    }
    const media = await withTenantTransaction(req.user!.tenantId, async (tx) => {
                return tx.productMedia.create({
                    data: {
                        url, altText, sortOrder: sortOrder || 0, productId,
                        tenantId: req.user!.tenantId
                    }
                });
            });
    res.status(201).json(media);
});

// PUT /api/media/:id
router.put("/:id", async (req: AuthRequest, res) => {
    const { url, altText, sortOrder, productId } = req.body;
    if (!url || !productId) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    const media = await withTenantTransaction(req.user!.tenantId, async (tx) => {
                return tx.productMedia.update({
                    where: { id: req.params.id, deletedAt: null },
                    data: { url, altText, sortOrder, productId }
                });
            });
    res.json(media);
});

// PATCH /api/media/:id
router.patch("/:id", async (req: AuthRequest, res) => {
    const media = await withTenantTransaction(req.user!.tenantId, async (tx) => {
                return tx.productMedia.update({
                    where: { id: req.params.id, deletedAt: null },
                    data: req.body
                });
            });
    res.json(media);
});

// DELETE /api/media/:id (Soft Delete)
router.delete("/:id", async (req: AuthRequest, res) => {
    await withTenantTransaction(req.user!.tenantId, async (tx) => {
                return tx.productMedia.update({
                    where: { id: req.params.id, deletedAt: null },
                    data: { deletedAt: new Date() }
                });
            });
    res.json({ message: "Media deleted successfully" });
});

export default router;
