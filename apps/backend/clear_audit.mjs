import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();
await prisma.auditLog.deleteMany();
console.log('Deleted');
await prisma.$disconnect();
