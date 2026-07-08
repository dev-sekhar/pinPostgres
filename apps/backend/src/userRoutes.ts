import { Router, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { prisma, withTenantTransaction } from "./prismaClient.js";
import { requireAuth, AuthRequest } from "./authMiddleware.js";
import { requirePermission } from "./rbacMiddleware.js";

const router = Router();
router.use(requireAuth as any);

// Omit password from user object
const excludePassword = (user: any) => {
    if (!user) return user;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

// GET /api/users
router.get("/", requirePermission("user.read") as any, async (req: AuthRequest, res) => {
    try {
        const users = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.user.findMany({
                where: { deletedAt: null },
                orderBy: { createdAt: "desc" },
                include: {
                    userRoles: {
                        include: { role: true }
                    }
                }
            });
        });
        res.json(users.map(excludePassword));
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// GET /api/users/:id
router.get("/:id", requirePermission("user.read") as any, async (req: AuthRequest, res) => {
    try {
        const user = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            return tx.user.findUnique({
                where: { id: req.params.id, deletedAt: null },
                include: {
                    userRoles: {
                        include: { role: true }
                    }
                }
            });
        });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(excludePassword(user));
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

// POST /api/users (Create a new user)
router.post("/", requirePermission("user.create") as any, async (req: AuthRequest, res) => {
    const { email, name, password, roleIds } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Missing required fields (email, password)" });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email,
                    name,
                    password: hashedPassword,
                    role: "USER", // Legacy
                    tenantId: req.user!.tenantId
                }
            });
            if (roleIds && Array.isArray(roleIds)) {
                await tx.userRole.createMany({
                    data: roleIds.map(rId => ({ userId: newUser.id, roleId: rId }))
                });
            }
            return newUser;
        });
        res.status(201).json(excludePassword(user));
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: "Email already in use" });
        }
        res.status(500).json({ error: "Failed to create user" });
    }
});

// PUT /api/users/:id 
router.put("/:id", requirePermission("user.update") as any, async (req: AuthRequest, res) => {
    const { email, name, password, roleIds } = req.body;
    if (!email) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        const data: any = { email, name };
        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        const user = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const updatedUser = await tx.user.update({
                where: { id: req.params.id, deletedAt: null },
                data
            });

            if (roleIds && Array.isArray(roleIds)) {
                // Prevent removing Master Admin role from self? Not implemented here yet.
                await tx.userRole.deleteMany({ where: { userId: req.params.id } });
                await tx.userRole.createMany({
                    data: roleIds.map(rId => ({ userId: req.params.id, roleId: rId }))
                });
            }
            return updatedUser;
        });
        res.json(excludePassword(user));
    } catch (error) {
        res.status(500).json({ error: "Failed to update user" });
    }
});

// PATCH /api/users/:id
router.patch("/:id", requirePermission("user.update") as any, async (req: AuthRequest, res) => {
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

// DELETE /api/users/:id (Soft Delete)
router.delete("/:id", requirePermission("user.delete") as any, async (req: AuthRequest, res) => {
    try {
        await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const userToDelete = await tx.user.findUnique({
                where: { id: req.params.id, deletedAt: null },
                include: {
                    userRoles: {
                        include: {
                            role: true
                        }
                    }
                }
            });

            if (!userToDelete) {
                throw new Error("NOT_FOUND");
            }

            const isMasterAdmin = userToDelete.userRoles.some((ur: any) => ur.role.name === 'Administrator');
            if (isMasterAdmin) {
                throw new Error("CANNOT_DELETE_MASTER_ADMIN");
            }

            return tx.user.update({
                where: { id: req.params.id },
                data: { deletedAt: new Date() }
            });
        });
        res.json({ message: "User deleted successfully" });
    } catch (error: any) {
        if (error.message === "NOT_FOUND") {
            return res.status(404).json({ error: "User not found" });
        }
        if (error.message === "CANNOT_DELETE_MASTER_ADMIN") {
            return res.status(403).json({ error: "Cannot delete a master tenant admin" });
        }
        res.status(500).json({ error: "Failed to delete user" });
    }
});

export default router;
