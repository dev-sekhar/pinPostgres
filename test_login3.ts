import { prisma } from './apps/backend/src/prismaClient.js';

async function test() {
  const email = "test@admin.com";
  try {
      const users = await prisma.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT set_config('app.bypass_rls', 'on', true)`;
          return tx.$queryRaw`SELECT * FROM "User" WHERE "email" = ${email} AND "deletedAt" IS NULL`;
      });
      console.log("Users returned:", users);
  } catch (e) {
      console.error(e);
  } finally {
      prisma.$disconnect();
  }
}

test();
