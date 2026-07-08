import { Router } from "express";
import { validateSchema } from "../middleware/schemaValidation.js";
import { requireAuth, AuthRequest } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/rbacMiddleware.js";
import { channelService } from "../services/channelService.js";

const router = Router();
router.use(requireAuth as any);

router.get("/", requirePermission("channel.read") as any, async (req: AuthRequest, res) => {
    const items = await channelService.getChannels(req.user!.tenantId);
    res.json(items);
});

router.get("/:id", requirePermission("channel.read") as any, async (req: AuthRequest, res) => {
    const item = await channelService.getChannelById(req.user!.tenantId, req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
});

router.post("/", requirePermission("channel.create") as any, validateSchema("Channel") as any, async (req: AuthRequest, res) => {
    const item = await channelService.createChannel(req.user!.tenantId, req.user!.userId, req.body, (req as any).auditMeta);
    res.status(201).json(item);
});

router.put("/:id", requirePermission("channel.update") as any, validateSchema("Channel") as any, async (req: AuthRequest, res) => {
    delete req.body.status; // Prevent status update via generic endpoint
    try {
        const item = await channelService.updateChannel(req.user!.tenantId, req.user!.userId, req.params.id, req.body, (req as any).auditMeta);
        res.json(item);
    } catch (error: any) {
        if (error.message === "Channel not found") return res.status(404).json({ error: "Not found" });
        res.status(500).json({ error: "Internal server error" });
    }
});

router.delete("/:id", requirePermission("channel.delete") as any, async (req: AuthRequest, res) => {
    try {
        const item = await channelService.deleteChannel(req.user!.tenantId, req.user!.userId, req.params.id, (req as any).auditMeta);
        res.json(item);
    } catch (error: any) {
        if (error.message === "Channel not found") return res.status(404).json({ error: "Not found" });
        res.status(500).json({ error: "Internal server error" });
    }
});


// PATCH /api/channels/:id/status
router.patch("/:id/status", requirePermission("channel.status.update") as any, async (req: AuthRequest, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required" });

    try {
        const updated = await channelService.updateChannel(
            req.user!.tenantId,
            req.user!.userId,
            req.params.id,
            { status },
            (req as any).auditMeta
        );
        if (!updated) return res.status(404).json({ error: "channel not found" });
        res.json(updated);
    } catch (error: any) {
        console.error("Error updating channel status:", error);
        res.status(500).json({ error: "Failed to update channel status" });
    }
});

export default router;
