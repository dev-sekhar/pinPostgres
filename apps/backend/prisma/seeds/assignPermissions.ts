import { prisma } from "../../src/prismaClient.js";

async function main() {
    const permissions = await prisma.permission.findMany();
    const roles = await prisma.role.findMany();
    
    let count = 0;
    for (const role of roles) {
        for (const p of permissions) {
            try {
                await prisma.rolePermission.upsert({
                    where: { roleId_permissionId: { roleId: role.id, permissionId: p.id } },
                    update: {},
                    create: { roleId: role.id, permissionId: p.id }
                });
                count++;
            } catch (e) {
                // Ignore duplicates
            }
        }
    }
    console.log(`Assigned ${count} permissions to ${roles.length} roles.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
