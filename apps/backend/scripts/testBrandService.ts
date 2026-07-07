import { prisma } from "../src/prismaClient.js";
import { brandService } from "../src/services/brandService.js";
import fs from "fs";
import path from "path";

async function runTests() {
    console.log("Running Brand Service Tests...");
    const reportPath = path.resolve(process.cwd(), "reports", "brandApiTestResults.txt");
    const reportsDir = path.dirname(reportPath);
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    let reportContent = "Brand Service Test Results\n==========================\n\n";
    let passed = 0;
    let failed = 0;

    const log = (msg: string) => {
        console.log(msg);
        reportContent += msg + "\n";
    };

    const assert = (condition: boolean, testName: string) => {
        if (condition) {
            log(`✅ PASS: ${testName}`);
            passed++;
        } else {
            log(`❌ FAIL: ${testName}`);
            failed++;
        }
    };

    try {
        // Find a valid tenant to test against
        const tenant = await prisma.tenant.findFirst();
        if (!tenant) {
            log("No tenant found to run tests. Skipping.");
            fs.writeFileSync(reportPath, reportContent);
            return;
        }

        const tenantId = tenant.id;
        const testCode = `TEST_BRAND_${Date.now()}`;

        // Test 1: Create
        const createdBrand = await brandService.createBrand(tenantId, undefined, {
            code: testCode,
            name: "Test Brand",
            email: "test@example.com",
            website: "https://example.com"
        });
        assert(createdBrand !== null && createdBrand.code === testCode, "Create Brand");

        // Test 2: Read
        const readBrand = await prisma.brand.findUnique({ where: { id: createdBrand.id } });
        assert(readBrand !== null && readBrand.name === "Test Brand", "Read Brand");

        // Test 3: Update
        const updatedBrand = await brandService.updateBrand(tenantId, undefined, createdBrand.id, {
            name: "Updated Test Brand"
        });
        assert(updatedBrand !== null && updatedBrand.name === "Updated Test Brand", "Update Brand (Full/Partial)");

        // Test 4: Soft Delete
        const deletedBrand = await brandService.deleteBrand(tenantId, undefined, createdBrand.id);
        assert(deletedBrand !== null && deletedBrand.deletedAt !== null, "Soft Delete Brand");

        // Verify it doesn't show up in normal queries where deletedAt is null
        const findDeleted = await prisma.brand.findFirst({ where: { id: createdBrand.id, deletedAt: null } });
        assert(findDeleted === null, "Deleted brand is excluded from active queries");

    } catch (error: any) {
        log(`\nFATAL ERROR during tests: ${error.message}`);
        console.error(error);
    } finally {
        log(`\nTotal Passed: ${passed}`);
        log(`Total Failed: ${failed}`);
        fs.writeFileSync(reportPath, reportContent);
        console.log(`Report written to ${reportPath}`);
        await prisma.$disconnect();
    }
}

runTests();
