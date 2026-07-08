import { Router } from "express";
import { prisma } from "./prismaClient.js";
import { requireAuth } from "./authMiddleware.js";

const router = Router();
router.use(requireAuth as any);

// GET /api/uoms
router.get("/", async (req, res) => {
    try {
        const uoms = await prisma.unitOfMeasure.findMany({
            orderBy: { name: "asc" }
        });
        res.json(uoms);
    } catch (error) {
        console.error("Error fetching units of measure:", error);
        res.status(500).json({ error: "Failed to fetch units of measure" });
    }
});

export default router;
