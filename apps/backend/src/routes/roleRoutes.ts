import { Router } from "express";
import { prisma, withTenantTransaction } from "../prismaClient.js";
import { requireAuth, AuthRequest } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/rbacMiddleware.js";
import { auditService } from "../services/auditService.js";

const router = Router();
router.use(requireAuth as any);
router.use(requirePermission("tenant.manage") as any);

// GET /api/roles
router.get("/", async (req: AuthRequest, res) => {
    const roles = await withTenantTransaction(req.user!.tenantId, async (tx) => {
                return tx.role.findMany({
                    where: { tenantId: req.user!.tenantId },
                    include: {
                        rolePermissions: {
                            include: { permission: true }
                        }
                    },
                    orderBy: { createdAt: "desc" }
                });
            });
    res.json(roles);
});

// POST /api/roles
router.post("/", async (req: AuthRequest, res) => {
    const { name, description, permissionIds } = req.body;
    if (!name) return res.status(400).json({ error: "Role name is required" });

    try {
        const role = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const newRole = await tx.role.create({
                data: {
                    name,
                    description,
                    tenantId: req.user!.tenantId,
                    roleType: 'CUSTOM' // Only CUSTOM roles can be created via API
                }
            });

            if (permissionIds && Array.isArray(permissionIds)) {
                await tx.rolePermission.createMany({
                    data: permissionIds.map(pId => ({
                        roleId: newRole.id,
                        permissionId: pId
                    }))
                });
            }

            await auditService.logEvent(tx, {
                tenantId: req.user!.tenantId,
                userId: req.user!.userId,
                entityType: 'Role',
                entityId: newRole.id,
                operation: 'CREATE',
                afterState: newRole,
                remarks: `Created custom role ${name}`,
                auditMeta: (req as any).auditMeta
            });

            return newRole;
        });

        res.status(201).json(role);
    } catch (error: any) {
        if (error.code === 'P2002') return res.status(409).json({ error: "Role name already exists" });
        res.status(500).json({ error: "Failed to create role" });
    }
});

// PUT /api/roles/:id
router.put("/:id", async (req: AuthRequest, res) => {
    const { name, description, isActive, permissionIds } = req.body;
    try {
        const role = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const existingRole = await tx.role.findUnique({ where: { id: req.params.id } });
            if (!existingRole) throw new Error("NOT_FOUND");
            if (existingRole.roleType === 'SYSTEM') throw new Error("CANNOT_EDIT_SYSTEM");

            const beforeState = await tx.role.findUnique({
                where: { id: req.params.id },
                include: { rolePermissions: true }
            });

            const updatedRole = await tx.role.update({
                where: { id: req.params.id },
                data: { name, description, isActive }
            });

            if (permissionIds && Array.isArray(permissionIds)) {
                await tx.rolePermission.deleteMany({ where: { roleId: req.params.id } });
                await tx.rolePermission.createMany({
                    data: permissionIds.map(pId => ({
                        roleId: req.params.id,
                        permissionId: pId
                    }))
                });
            }

            const afterState = await tx.role.findUnique({
                where: { id: req.params.id },
                include: { rolePermissions: true }
            });

            await auditService.logEvent(tx, {
                tenantId: req.user!.tenantId,
                userId: req.user!.userId,
                entityType: 'Role',
                entityId: updatedRole.id,
                operation: 'UPDATE',
                beforeState,
                afterState,
                remarks: `Updated role ${updatedRole.name}`,
                auditMeta: (req as any).auditMeta
            });

            return updatedRole;
        });
        res.json(role);
    } catch (error: any) {
        if (error.message === "NOT_FOUND") return res.status(404).json({ error: "Role not found" });
        if (error.message === "CANNOT_EDIT_SYSTEM") return res.status(403).json({ error: "Cannot edit a SYSTEM role" });
        res.status(500).json({ error: "Failed to update role" });
    }
});

// DELETE /api/roles/:id
router.delete("/:id", async (req: AuthRequest, res) => {
    try {
        await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const existingRole = await tx.role.findUnique({ where: { id: req.params.id } });
            if (!existingRole) throw new Error("NOT_FOUND");
            if (existingRole.roleType === 'SYSTEM') throw new Error("CANNOT_DELETE_SYSTEM");

            await tx.role.delete({ where: { id: req.params.id } });

            await auditService.logEvent(tx, {
                tenantId: req.user!.tenantId,
                userId: req.user!.userId,
                entityType: 'Role',
                entityId: req.params.id,
                operation: 'DELETE',
                beforeState: existingRole,
                remarks: `Deleted role ${existingRole.name}`,
                auditMeta: (req as any).auditMeta
            });
        });
        res.json({ message: "Role deleted successfully" });
    } catch (error: any) {
        if (error.message === "NOT_FOUND") return res.status(404).json({ error: "Role not found" });
        if (error.message === "CANNOT_DELETE_SYSTEM") return res.status(403).json({ error: "Cannot delete a SYSTEM role" });
        res.status(500).json({ error: "Failed to delete role" });
    }
});

// GET /api/permissions (Global list of available permissions)
router.get("/permissions/all", async (req: AuthRequest, res) => {
    const permissions = await prisma.permission.findMany({
                orderBy: [{ module: 'asc' }, { name: 'asc' }]
            });
    res.json(permissions);
});

export default router;
