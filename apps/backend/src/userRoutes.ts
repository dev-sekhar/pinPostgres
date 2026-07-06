import { Router, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { prisma, withTenantTransaction } from "./prismaClient.js";
import { requireAuth, AuthRequest } from "./authMiddleware.js";

const router = Router();
router.use(requireAuth as any);

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden: Admins only" });
    }
    next();
};

// Omit password from user object
const excludePassword = (user: any) => {
    if (!user) return user;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

// GET /api/users
router.get("/", async (req: AuthRequest, res) => {
    try {
        const users = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.user.findMany({
                where: { deletedAt: null },
                orderBy: { createdAt: "desc" }
            });
        });
        res.json(users.map(excludePassword));
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// GET /api/users/:id
router.get("/:id", async (req: AuthRequest, res) => {
    try {
        const user = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.user.findUnique({
                where: { id: req.params.id, deletedAt: null }
            });
        });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(excludePassword(user));
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

// POST /api/users (Create a new user - Admins only)
router.post("/", requireAdmin as any, async (req: AuthRequest, res) => {
    const { email, name, password, role } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Missing required fields (email, password)" });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.user.create({
                data: {
                    email,
                    name,
                    password: hashedPassword,
                    role: role || "USER",
                    tenantId: req.user!.tenantId
                }
            });
        });
        res.status(201).json(excludePassword(user));
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: "Email already in use" });
        }
        res.status(500).json({ error: "Failed to create user" });
    }
});

// PUT /api/users/:id (Admins only)
router.put("/:id", requireAdmin as any, async (req: AuthRequest, res) => {
    const { email, name, password, role } = req.body;
    if (!email) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        const data: any = { email, name, role };
        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        const user = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.user.update({
                where: { id: req.params.id, deletedAt: null },
                data
            });
        });
        res.json(excludePassword(user));
    } catch (error) {
        res.status(500).json({ error: "Failed to update user" });
    }
});

// PATCH /api/users/:id (Admins only)
router.patch("/:id", requireAdmin as any, async (req: AuthRequest, res) => {
    try {
        const data = { ...req.body };
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }

        const user = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.user.update({
                where: { id: req.params.id, deletedAt: null },
                data
            });
        });
        res.json(excludePassword(user));
    } catch (error) {
        res.status(500).json({ error: "Failed to update user" });
    }
});

// DELETE /api/users/:id (Soft Delete - Admins only)
router.delete("/:id", requireAdmin as any, async (req: AuthRequest, res) => {
    try {
        await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.user.update({
                where: { id: req.params.id, deletedAt: null },
                data: { deletedAt: new Date() }
            });
        });
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete user" });
    }
});

export default router;
