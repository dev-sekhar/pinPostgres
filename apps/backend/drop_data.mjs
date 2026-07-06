import pkg from './src/generated/prisma/index.js';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
    console.log("Dropping all Product and AttributeDefinition data...");
    await prisma.$executeRawUnsafe(`DELETE FROM "AttributeDefinition"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Product"`);
    console.log("Data dropped successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
