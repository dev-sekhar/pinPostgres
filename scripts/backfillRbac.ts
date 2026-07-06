import 'dotenv/config';
import { prisma } from '../apps/backend/src/prismaClient.js';

async function main() {
    console.log('Starting RBAC backfill for existing tenants and users...');

    const tenants = await prisma.tenant.findMany({
        include: {
            users: true
        }
    });

    const allPermissions = await prisma.permission.findMany();
    const readPermissions = allPermissions.filter(p => p.code.endsWith('.read'));

    for (const tenant of tenants) {
        console.log(`Processing tenant: ${tenant.name} (${tenant.id})`);

        // Check if Administrator role exists
        let adminRole = await prisma.role.findFirst({
            where: { tenantId: tenant.id, name: 'Administrator' }
        });

        if (!adminRole) {
            adminRole = await prisma.role.create({
                data: {
                    tenantId: tenant.id,
                    name: 'Administrator',
                    description: 'Full access to all modules',
                    roleType: 'SYSTEM'
                }
            });

            await prisma.rolePermission.createMany({
                data: allPermissions.map(p => ({
                    roleId: adminRole!.id,
                    permissionId: p.id
                }))
            });
            console.log(`Created Administrator role for tenant ${tenant.name}`);
        }

        // Check if Viewer role exists
        let viewerRole = await prisma.role.findFirst({
            where: { tenantId: tenant.id, name: 'Viewer' }
        });

        if (!viewerRole) {
            viewerRole = await prisma.role.create({
                data: {
                    tenantId: tenant.id,
                    name: 'Viewer',
                    description: 'Read-only access to all modules',
                    roleType: 'SYSTEM'
                }
            });

            await prisma.rolePermission.createMany({
                data: readPermissions.map(p => ({
                    roleId: viewerRole!.id,
                    permissionId: p.id
                }))
            });
            console.log(`Created Viewer role for tenant ${tenant.name}`);
        }

        // Backfill users
        for (const user of tenant.users) {
            const hasRole = await prisma.userRole.findFirst({
                where: { userId: user.id }
            });

            if (!hasRole) {
                // Determine role based on legacy string `role` field
                const roleIdToAssign = user.role === 'ADMIN' ? adminRole.id : viewerRole.id;
                
                await prisma.userRole.create({
                    data: {
                        userId: user.id,
                        roleId: roleIdToAssign
                    }
                });
                console.log(`Assigned role ${user.role === 'ADMIN' ? 'Administrator' : 'Viewer'} to user ${user.email}`);
            }
        }
    }

    console.log('RBAC backfill completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
