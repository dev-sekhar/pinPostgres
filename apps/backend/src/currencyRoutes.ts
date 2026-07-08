import { Router } from "express";
import { prisma } from "./prismaClient.js";
import { requireAuth } from "./authMiddleware.js";

const router = Router();
router.use(requireAuth as any);

// GET /api/currencies
router.get("/", async (req, res) => {
    const currencies = await prisma.currency.findMany({
            orderBy: { code: "asc" }
        });
        res.json(currencies);
});

export default router;
