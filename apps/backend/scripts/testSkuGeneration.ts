import { prisma } from '../src/prismaClient.js';

async function run() {
    console.log("Testing SKU auto-generation logic...");

    const tenant = await prisma.tenant.findFirst();

    if (!tenant) {
        console.error("Default tenant not found. Please run seed first.");
        return;
    }

    const category = await prisma.category.findFirst({ where: { tenantId: tenant.id } });
    if (!category) throw new Error("No category found");
    const family = await prisma.productFamily.findFirst({ where: { tenantId: tenant.id } });
    if (!family) throw new Error("No product family found");

    // Clean up old settings
    await prisma.tenantSettings.deleteMany({ where: { tenantId: tenant.id } });

    // Set custom settings
    await prisma.tenantSettings.create({
        data: {
            tenantId: tenant.id,
            productSkuPattern: "TEST-{SEQ}",
            productSkuSeq: 0,
            variantSkuPattern: "{PARENT_SKU}-V-{SEQ}"
        }
    });

    const adminUser = await prisma.user.findFirst({ where: { tenantId: tenant.id, role: 'SYSTEM_ADMIN' } });
    if (!adminUser) throw new Error("Admin user not found");

    const response = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminUser.email, password: "password123" }) // assuming password123 from seed
    });
    
    if (!response.ok) {
        console.error("Login failed", await response.text());
        return;
    }

    const { token } = await response.json();

    // 1. Create Base Product
    const baseProductRes = await fetch("http://localhost:4000/api/products", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            name: "Test Base Product",
            price: 99.99,
            productFamilyId: family.id
        })
    });

    const baseProduct = await baseProductRes.json();
    console.log("Base Product Created:", baseProduct.sku, "Expected: TEST-001");

    // 2. Create Variant 1
    const var1Res = await fetch("http://localhost:4000/api/products", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            name: "Test Variant 1",
            price: 109.99,
            productFamilyId: family.id,
            parentId: baseProduct.id
        })
    });
    const var1 = await var1Res.json();
    console.log("Variant 1 Created:", var1.sku, "Expected: TEST-001-V-001");

    // 3. Create Variant 2
    const var2Res = await fetch("http://localhost:4000/api/products", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            name: "Test Variant 2",
            price: 119.99,
            productFamilyId: family.id,
            parentId: baseProduct.id
        })
    });
    const var2 = await var2Res.json();
    console.log("Variant 2 Created:", var2.sku, "Expected: TEST-001-V-002");

    // 4. Update patterns
    await fetch("http://localhost:4000/api/settings/sku", {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            productSkuPattern: "NEW-{SEQ}",
            variantSkuPattern: "{PARENT_SKU}-X-{SEQ}"
        })
    });
    
    // 5. Create Base Product 2
    const baseProduct2Res = await fetch("http://localhost:4000/api/products", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            name: "Test Base Product 2",
            price: 199.99,
            productFamilyId: family.id
        })
    });
    const baseProduct2 = await baseProduct2Res.json();
    console.log("Base Product 2 Created:", baseProduct2.sku, "Expected: NEW-002");

    // Verify variants on product 2
    const var3Res = await fetch("http://localhost:4000/api/products", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            name: "Test Variant 3",
            price: 219.99,
            productFamilyId: family.id,
            parentId: baseProduct2.id
        })
    });
    const var3 = await var3Res.json();
    console.log("Variant 3 Created:", var3.sku, "Expected: NEW-002-X-001");
}

run().catch(console.error);
