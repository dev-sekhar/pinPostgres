import { prisma } from './prismaClient.js';

async function test() {
  const email = "test@admin.com";
  try {
      const users = await prisma.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT set_config('app.bypass_rls', 'on', true)`;
          return tx.user.findMany({
              where: { email, deletedAt: null }
          });
      });
      console.log("Users returned:", users.length);
      console.log("Users details:", users);
  } catch (e) {
      console.error(e);
  } finally {
      prisma.$disconnect();
  }
}

test();
