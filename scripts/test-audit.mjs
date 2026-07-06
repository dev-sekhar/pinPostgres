import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function test() {
  // 1. Login
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Integration-Test' },
    body: JSON.stringify({ email: 'tony@stark.com', password: 'password123' })
  });
  const { token, user } = await loginRes.json();
  
  // 2. Create product
  const ts = Date.now();
  const createRes = await fetch('http://localhost:3001/api/products', {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Integration-Test'
    },
    body: JSON.stringify({ sku: `AUDIT-PROD-${ts}`, name: 'Audit Test Product', price: 10.99 })
  });
  const newProduct = await createRes.json();
  
  // 3. Check Audit Logs directly in DB
  const logs = await prisma.auditLog.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { createdAt: 'desc' },
    take: 2
  });
  
  console.log("Latest Audit Logs:");
  console.dir(logs, { depth: null });
  
  await prisma.$disconnect();
}

test();
