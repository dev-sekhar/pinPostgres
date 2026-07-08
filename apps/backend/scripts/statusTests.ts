import { prisma, withTenantTransaction } from '../src/prismaClient.js';
import { brandService } from '../src/services/brandService.js';
import * as fs from 'fs';

async function runStatusTests() {
    console.log("=== Running Status Lifecycle Tests ===");
    let results = { success: 0, failed: 0, details: [] as any[] };

    try {
        let tenantId = '11111111-1111-1111-1111-111111111111'; // Mock tenant or skip user creation
        
        // Wait, instead of raw queries, we can just use withTenantTransaction with a known tenant
        // from the database, or just skip user creation and find an existing tenant
        const t = await prisma.$queryRawUnsafe<{id: string}[]>('SELECT id FROM "Tenant" LIMIT 1');
        if (!t.length) throw new Error("No tenant found. Run seeds first.");
        tenantId = t[0].id;
        
        let userId = '11111111-1111-1111-1111-111111111111';
        
        await withTenantTransaction(tenantId, async (tx) => {
            // 1. Create a dummy brand
            console.log("1. Creating a brand...");
            const brandData = {
                code: "STATUS_TEST_BRAND_" + Date.now(),
                name: "Status Test Brand",
                status: "DRAFT"
            };
            
            const brand = await tx.brand.create({
                data: { ...brandData, tenantId }
            });
            console.log("Brand created with status:", brand.status);

            // 2. Change status to ACTIVE
            console.log("2. Changing status to ACTIVE...");
            const activeBrand = await tx.brand.update({
                where: { id: brand.id },
                data: { status: 'ACTIVE' }
            });
            
            if (activeBrand.status !== 'ACTIVE') {
                throw new Error("Failed to update status to ACTIVE");
            }
            console.log("Brand status updated successfully!");
            results.success++;
            results.details.push({ test: 'Change Brand Status', result: 'PASSED' });

            // 3. Create a dummy product
            console.log("3. Creating a product...");
            let family = await tx.productFamily.findFirst({ where: { tenantId } });
            if (!family) {
                const domain = await tx.domain.create({ data: { name: "Domain " + Date.now(), tenantId } });
                const cat = await tx.category.create({ data: { name: "Cat", tenantId, domainId: domain.id } });
                family = await tx.productFamily.create({ data: { name: "Fam", tenantId, categoryId: cat.id } });
            }
            
            const product = await tx.product.create({
                data: {
                    sku: "STATUS_SKU_" + Date.now(),
                    name: "Status Test Product",
                    price: 100,
                    productFamilyId: family.id,
                    tenantId,
                    status: "DRAFT"
                }
            });
            console.log("Product created with status:", product.status);

            // 4. Change product status to ARCHIVED
            console.log("4. Changing product status to ARCHIVED...");
            const archivedProduct = await tx.product.update({
                where: { id: product.id },
                data: { status: 'ARCHIVED' }
            });

            if (archivedProduct.status !== 'ARCHIVED') {
                throw new Error("Failed to update product status to ARCHIVED");
            }
            console.log("Product status updated successfully!");
            results.success++;
            results.details.push({ test: 'Change Product Status', result: 'PASSED' });
        });
    } catch (e: any) {
        console.error("Test failed:", e.message);
        results.failed++;
        results.details.push({ test: 'Status Lifecycle', result: 'FAILED', error: e.message });
    } finally {
        await prisma.$disconnect();
    }

    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const prefix = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}`;
    const reportPath = `../../reports/${prefix}_2_status_test.json`;
    
    fs.mkdirSync('../../reports', { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`Test report saved to ${reportPath}`);
}

runStatusTests().catch(console.error);
