import { prisma } from './apps/backend/src/prismaClient.js';

async function test() {
  const email = "test@admin.com";
  const [_, users] = await prisma.$transaction([
      prisma.$executeRaw`SELECT set_config('app.bypass_rls', 'on', true)`,
      prisma.user.findMany({
          where: { email, deletedAt: null }
      })
  ]);
  console.log("Users:", users);
}

test().catch(console.error).finally(()=>prisma.$disconnect());
