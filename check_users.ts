import { prisma } from './apps/backend/src/prismaClient.js';

async function check() {
  const users = await prisma.user.findMany();
  console.log('Users count:', users.length);
  if (users.length > 0) {
    console.log('First user:', users[0].email);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
