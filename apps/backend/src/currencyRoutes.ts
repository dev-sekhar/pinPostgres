import { Router } from "express";
import { prisma } from "./prismaClient.js";
import { requireAuth } from "./authMiddleware.js";

const router = Router();
router.use(requireAuth as any);

// GET /api/currencies
router.get("/", async (req, res) => {
    try {
        const currencies = await prisma.currency.findMany({
            orderBy: { code: "asc" }
        });
        res.json(currencies);
    } catch (error) {
        console.error("Error fetching currencies:", error);
        res.status(500).json({ error: "Failed to fetch currencies" });
    }
});

export default router;
