import { prisma } from './src/prismaClient.js';

async function main() {
    console.log("Dropping all Product and AttributeDefinition data...");
    await prisma.$executeRawUnsafe(`DELETE FROM "AttributeDefinition"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Product"`);
    console.log("Data dropped successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
