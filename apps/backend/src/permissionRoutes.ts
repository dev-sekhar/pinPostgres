import { Router } from "express";
import { requireAuth, AuthRequest } from "./authMiddleware.js";
import { permissionService } from "./services/permissionService.js";

const router = Router();
router.use(requireAuth as any);

router.get("/", async (req: AuthRequest, res) => {
    try {
        const items = await permissionService.getAllPermissions();
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
