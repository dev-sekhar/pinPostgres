import { Router } from "express";
import { prisma } from "./prismaClient.js";
import { requireAuth } from "./authMiddleware.js";

const router = Router();
router.use(requireAuth as any);

// GET /api/countries
router.get("/", async (req, res) => {
    try {
        const countries = await prisma.country.findMany({
            orderBy: { name: "asc" }
        });
        res.json(countries);
    } catch (error) {
        console.error("Error fetching countries:", error);
        res.status(500).json({ error: "Failed to fetch countries" });
    }
});

export default router;
