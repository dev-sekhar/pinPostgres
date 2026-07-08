import { prisma } from '../src/prismaClient.js';

async function fix() {
    console.log("Checking roles...");
    const roles = await prisma.role.findMany();
    console.log(roles.map(r => r.name));

    const permissions = await prisma.permission.findMany({
        where: { code: { in: [
            'settings.read', 'settings.update',
            'supplier.read', 'supplier.create', 'supplier.update', 'supplier.delete',
            'manufacturer.read', 'manufacturer.create', 'manufacturer.update', 'manufacturer.delete',
            'complianceType.read', 'complianceType.create', 'complianceType.update', 'complianceType.delete',
            'channel.read', 'channel.create', 'channel.update', 'channel.delete'
        ] } }
    });

    console.log("Found permissions:", permissions.map(p => p.code));

    for (const role of roles) {
        if (role.roleType === 'SYSTEM' || role.name.toLowerCase().includes('admin')) {
            console.log("Assigning to role:", role.name);
            for (const p of permissions) {
                const existing = await prisma.rolePermission.findUnique({
                    where: { roleId_permissionId: { roleId: role.id, permissionId: p.id } }
                });
                if (!existing) {
                    // Only assign write permissions to Admin, not Viewer
                    if (p.code.includes('.read') || role.name.toLowerCase().includes('admin') || role.roleType === 'SYSTEM') {
                        await prisma.rolePermission.create({
                            data: { roleId: role.id, permissionId: p.id }
                        });
                        console.log("Assigned", p.code, "to", role.name);
                    }
                }
            }
        }
    }
}

fix().catch(console.error).finally(() => prisma.$disconnect());
