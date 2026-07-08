import { Router } from "express";
import { prisma } from "./prismaClient.js";
import { requireAuth } from "./authMiddleware.js";

const router = Router();
router.use(requireAuth as any);

// GET /api/countries
router.get("/", async (req, res) => {
    const countries = await prisma.country.findMany({
            orderBy: { name: "asc" }
        });
        res.json(countries);
});

export default router;
