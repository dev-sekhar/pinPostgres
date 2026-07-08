import { Router } from "express";
import { requireAuth, AuthRequest } from "./authMiddleware.js";
import { permissionService } from "./services/permissionService.js";

const router = Router();
router.use(requireAuth as any);

router.get("/", async (req: AuthRequest, res) => {
    const items = await permissionService.getAllPermissions();
    res.json(items);
});

export default router;
