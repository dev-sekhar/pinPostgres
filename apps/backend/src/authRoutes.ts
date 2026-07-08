import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma, withTenantTransaction } from "./prismaClient.js";
import { auditService } from "./services/auditService.js";

const router = Router();

router.post("/register-tenant", async (req, res) => {
    const { companyName, adminName, adminEmail, adminPassword } = req.body;

        if (!companyName || !adminEmail || !adminPassword) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (existingUser) {
            return res.status(409).json({ error: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Run in a transaction to ensure both Tenant and User are created
        const result = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: companyName
                }
            });

            // Set RLS config for the new tenant to allow User creation
            await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenant.id}, true)`;

            // Fetch all global permissions
            const allPermissions = await tx.permission.findMany();
            
            // Create Administrator Role (SYSTEM)
            const adminRole = await tx.role.create({
                data: {
                    tenantId: tenant.id,
                    name: 'Administrator',
                    description: 'Full access to all modules',
                    roleType: 'SYSTEM'
                }
            });

            // Create Viewer Role (SYSTEM)
            const viewerRole = await tx.role.create({
                data: {
                    tenantId: tenant.id,
                    name: 'Viewer',
                    description: 'Read-only access to all modules',
                    roleType: 'SYSTEM'
                }
            });

            // Map all permissions to Administrator
            await tx.rolePermission.createMany({
                data: allPermissions.map(p => ({
                    roleId: adminRole.id,
                    permissionId: p.id
                }))
            });

            // Map read permissions to Viewer
            const readPermissions = allPermissions.filter(p => p.code.endsWith('.read'));
            await tx.rolePermission.createMany({
                data: readPermissions.map(p => ({
                    roleId: viewerRole.id,
                    permissionId: p.id
                }))
            });

            const user = await tx.user.create({
                data: {
                    email: adminEmail,
                    name: adminName,
                    password: hashedPassword,
                    role: "ADMIN", // Legacy field, kept for backward compatibility for now
                    tenantId: tenant.id
                }
            });

            // Assign Administrator role to the new user
            await tx.userRole.create({
                data: {
                    userId: user.id,
                    roleId: adminRole.id
                }
            });

            return { tenant, user };
        });

        // Omit password from response
        const { password, ...userWithoutPassword } = result.user;

        res.status(201).json({
            message: "Tenant registered successfully",
            tenant: result.tenant,
            user: userWithoutPassword
        });
});

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev";

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Missing email or password" });
        }

        const [_, users] = await prisma.$transaction([
            prisma.$executeRaw`SELECT set_config('app.bypass_rls', 'on', true)`,
            prisma.user.findMany({
                where: { email, deletedAt: null }
            })
        ]);
        console.log("Login lookup for", email, "found:", users);
        const user = users[0];

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { userId: user.id, tenantId: user.tenantId, role: user.role },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        const { password: _pw, ...userWithoutPassword } = user;

        await withTenantTransaction(user.tenantId, async (tx) => {
            await auditService.logEvent(tx, {
                tenantId: user.tenantId,
                userId: user.id,
                entityType: 'User',
                entityId: user.id,
                operation: 'LOGIN',
                remarks: 'User logged in successfully',
                auditMeta: (req as any).auditMeta
            });
        });

        res.status(200).json({
            message: "Login successful",
            token,
            user: userWithoutPassword
        });
});

import { requireAuth, AuthRequest } from "./authMiddleware.js";
import { permissionService } from "./services/permissionService.js";

router.get("/me/permissions", requireAuth as any, async (req: AuthRequest, res) => {
    if (!req.user || !req.user.userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const permissions = await permissionService.getUserPermissions(req.user.userId);
        res.json({ permissions });
});

router.get("/me", requireAuth as any, async (req: AuthRequest, res) => {
    if (!req.user || !req.user.userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        
        const userWithTenant = await withTenantTransaction(req.user.tenantId, async (tx) => {
            return tx.user.findUnique({
                where: { id: req.user!.userId },
                include: {
                    tenant: true
                }
            });
        });
        
        if (!userWithTenant) {
            return res.status(404).json({ error: "User not found" });
        }
        
        const { password, ...userWithoutPassword } = userWithTenant;
        res.json({ user: userWithoutPassword, tenant: userWithTenant.tenant });
});

export default router;
