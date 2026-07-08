import { Router } from "express";
import { prisma } from "./prismaClient.js";
import { requireAuth } from "./authMiddleware.js";

const router = Router();
router.use(requireAuth as any);

// GET /api/uoms
router.get("/", async (req, res) => {
    const uoms = await prisma.unitOfMeasure.findMany({
            orderBy: { name: "asc" }
        });
        res.json(uoms);
});

export default router;
