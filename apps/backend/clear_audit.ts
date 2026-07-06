import { prisma } from './src/prismaClient.js';
async function main() {
  await prisma.auditLog.deleteMany();
  console.log('Deleted audit logs');
}
main().catch(console.error).finally(() => process.exit(0));
