import { prisma } from '../apps/backend/src/prismaClient.js';

async function main() {
    const email = "auto1@test.com"; // I need to get a real email from the DB first

    const allUsers = await prisma.$transaction([
        prisma.$executeRaw`SELECT set_config('app.bypass_rls', 'on', true)`,
        prisma.$queryRaw`SELECT * FROM "User" LIMIT 1`
    ]);
    const testUser = (allUsers[1] as any[])[0];
    if (!testUser) {
        console.log("No users found at all in DB!");
        return;
    }

    const testEmail = testUser.email;
    console.log("Testing login for:", testEmail);

    const [_, users] = await prisma.$transaction([
        prisma.$executeRaw`SELECT set_config('app.bypass_rls', 'on', true)`,
        prisma.user.findMany({
            where: { email: testEmail, deletedAt: null }
        })
    ]);
    
    console.log("Login lookup found:", users);
}

main().catch(console.error);
