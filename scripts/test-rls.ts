import { prisma } from '../apps/backend/src/prismaClient.js';

async function main() {
    const email = "auto1@test.com"; // dummy email
    const [_, currentUser, users] = await prisma.$transaction([
        prisma.$executeRaw`SELECT set_config('app.bypass_rls', 'on', true)`,
        prisma.$queryRaw`SELECT current_setting('app.bypass_rls', true) as bypass_rls`,
        prisma.user.findMany()
    ]);
    console.log("bypass_rls:", currentUser);
    console.log("Users Count:", users.length);
}

main().catch(console.error);
