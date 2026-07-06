import { prisma } from '../apps/backend/src/prismaClient.js';

async function checkDb() {
    const tenants = await prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3
    });
    
    // Bypass RLS to see all users
    const [_, users] = await prisma.$transaction([
        prisma.$executeRaw`SELECT set_config('app.bypass_rls', 'on', true)`,
        prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: 3
        })
    ]);

    console.log("\n--- RECENT TENANTS ---");
    console.table(tenants);

    console.log("\n--- RECENT USERS ---");
    console.table(users);
}

checkDb().catch(console.error);
