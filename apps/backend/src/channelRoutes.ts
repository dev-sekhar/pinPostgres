import { Router } from "express";
import { requireAuth, AuthRequest } from "./authMiddleware.js";
import { requirePermission } from "./rbacMiddleware.js";
import { channelService } from "./services/channelService.js";

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

router.post("/", requirePermission("channel.create") as any, async (req: AuthRequest, res) => {
    const item = await channelService.createChannel(req.user!.tenantId, req.user!.userId, req.body, (req as any).auditMeta);
        res.status(201).json(item);
});

router.put("/:id", requirePermission("channel.update") as any, async (req: AuthRequest, res) => {
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

export default router;
