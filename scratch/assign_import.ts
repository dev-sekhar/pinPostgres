import { prisma } from '../apps/backend/src/prismaClient.js';
async function run() {
  const adminRoles = await prisma.role.findMany(); // all roles
  const perms = await prisma.permission.findMany({ where: { code: { startsWith: 'import' } } });
  console.log('Admin roles:', adminRoles.length, 'Perms:', perms.length);
  for (const role of adminRoles) {
    for (const perm of perms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        create: { roleId: role.id, permissionId: perm.id },
        update: {}
      });
    }
  }
  console.log('Granted permissions.');
}
run().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
