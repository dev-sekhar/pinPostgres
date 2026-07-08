import { saveReport } from './reportUtils.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

saveReport(report);port path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure reports directory exists at project root
const projectRoot = path.resolve(__dirname, '..');
const reportsDir = path.join(projectRoot, 'reports');

if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

// Generate report filename: yyyymmdd_n
const now = new Date();
const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
let n = 1;
let reportPath = path.join(reportsDir, `${yyyymmdd}_${n}.json`);
while (fs.existsSync(reportPath)) {
    n++;
    reportPath = path.join(reportsDir, `${yyyymmdd}_${n}.json`);
}

const BASE_URL = 'http://localhost:3001';
const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: { total: 0, passed: 0, failed: 0 }
};

async function runTest(name, url, options) {
    console.log(`[TEST] ${name} (${options.method})`);
    try {
        const response = await fetch(url, options);
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }
        const success = response.ok;
        const result = {
            name,
            endpoint: `${options.method} ${url}`,
            status: response.status,
            success,
            data
        };
        results.tests.push(result);
        
        if (success) {
            console.log(`  ✅ PASSED (${response.status})`);
            results.summary.passed++;
        } else {
            console.log(`  ❌ FAILED (${response.status})`);
            results.summary.failed++;
        }
        results.summary.total++;
        return result;
    } catch (error) {
        console.log(`  ❌ ERROR (${error.message})`);
        results.tests.push({
            name,
            endpoint: `${options.method} ${url}`,
            status: null,
            success: false,
            error: error.message
        });
        results.summary.failed++;
        results.summary.total++;
        return null;
    }
}

async function runAll() {
    console.log('Starting API Tests...\n');

    // 1. Health Check
    await runTest('Health Check', `${BASE_URL}/health`, { method: 'GET' });
    
    const timestamp = Date.now();

    // ---------------------------------------------------------
    // TENANT A (Alice)
    // ---------------------------------------------------------
    const tenantA = {
        companyName: `Tenant A Corp ${timestamp}`,
        adminName: "Alice Admin",
        adminEmail: `alice${timestamp}@test.com`,
        adminPassword: "password123"
    };
    
    await runTest('Register Tenant A', `${BASE_URL}/api/auth/register-tenant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tenantA)
    });
    
    const loginA = await runTest('Login Tenant A', `${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: tenantA.adminEmail, password: tenantA.adminPassword })
    });
    
    let tokenA = loginA?.success ? loginA.data.token : '';
    
    // ---------------------------------------------------------
    // TENANT A (Alice) CRUD Operations
    // ---------------------------------------------------------

    // Attributes CRUD
    const createAttrRes = await runTest('Create Attribute for Tenant A (POST)', `${BASE_URL}/api/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
        body: JSON.stringify({ code: `color_${timestamp}`, name: "Color", type: "SELECT", options: ["Red", "Blue"] })
    });
    
    let attrId = createAttrRes?.success ? createAttrRes.data.id : null;

    if (attrId) {
        await runTest('Update Attribute (PUT)', `${BASE_URL}/api/attributes/${attrId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
            body: JSON.stringify({ code: `color_${timestamp}`, name: "Primary Color", type: "SELECT", options: ["Red", "Blue", "Green"] })
        });
        
        await runTest('Get Attributes (GET)', `${BASE_URL}/api/attributes`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${tokenA}` }
        });
    }

    // Media CRUD
    let prodId = null;
    const createProdRes = await runTest('Create Product for Tenant A (POST)', `${BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
        body: JSON.stringify({
            sku: `LAPTOP-A-${timestamp}`,
            name: "Alice's Laptop",
            description: "Belongs to Tenant A",
            price: 1000.00
        })
    });
    prodId = createProdRes?.success ? createProdRes.data.id : null;

    if (prodId) {
        const createMediaRes = await runTest('Create Media (POST)', `${BASE_URL}/api/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
            body: JSON.stringify({ url: "https://example.com/laptop.png", altText: "Front view", productId: prodId })
        });
        
        let mediaId = createMediaRes?.success ? createMediaRes.data.id : null;
        if (mediaId) {
            await runTest('Patch Media (PATCH)', `${BASE_URL}/api/media/${mediaId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
                body: JSON.stringify({ sortOrder: 1 })
            });

            await runTest('Get Media for Product (GET)', `${BASE_URL}/api/media/product/${prodId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${tokenA}` }
            });

            // Soft Delete Media
            await runTest('Delete Media (DELETE)', `${BASE_URL}/api/media/${mediaId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${tokenA}` }
            });
        }
        
        // Soft Delete Product
        await runTest('Delete Product (DELETE)', `${BASE_URL}/api/products/${prodId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${tokenA}` }
        });
    }

    // User Management CRUD (Admins only)
    const createUserRes = await runTest('Create User for Tenant A (POST)', `${BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
        body: JSON.stringify({ email: `manager_${timestamp}@test.com`, name: "Alice's Manager", password: "password123", role: "MANAGER" })
    });
    
    let createdUserId = createUserRes?.success ? createUserRes.data.id : null;

    if (createdUserId) {
        await runTest('Update User (PUT)', `${BASE_URL}/api/users/${createdUserId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
            body: JSON.stringify({ email: `manager_${timestamp}@test.com`, name: "Senior Manager", role: "MANAGER" })
        });
        
        await runTest('Get Users (GET)', `${BASE_URL}/api/users`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${tokenA}` }
        });

        await runTest('Delete User (DELETE)', `${BASE_URL}/api/users/${createdUserId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${tokenA}` }
        });
    }

    // ---------------------------------------------------------
    // TENANT B (Bob)
    // ---------------------------------------------------------
    const tenantB = {
        companyName: `Tenant B Corp ${timestamp}`,
        adminName: "Bob Admin",
        adminEmail: `bob${timestamp}@test.com`,
        adminPassword: "password123"
    };
    
    await runTest('Register Tenant B', `${BASE_URL}/api/auth/register-tenant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tenantB)
    });
    
    const loginB = await runTest('Login Tenant B', `${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: tenantB.adminEmail, password: tenantB.adminPassword })
    });
    
    let tokenB = loginB?.success ? loginB.data.token : '';
    
    const getProductsB = await runTest('Get Products for Tenant B (Isolation Check)', `${BASE_URL}/api/products`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${tokenB}` }
    });

    if (getProductsB && getProductsB.success) {
        // Log debug header if present
        try {
            const fetchRes = await fetch(`${BASE_URL}/api/products`, {
                headers: { 'Authorization': `Bearer ${tokenB}` }
            });
            console.log("DB User Info:", fetchRes.headers.get("X-Debug-User"));
        } catch (e) {}

        const productCount = getProductsB.data.length;
        if (productCount === 0) {
            console.log(`  ✅ RLS Verification Passed: Bob sees 0 products.`);
        } else {
            console.log(`  ❌ RLS Verification Failed: Bob sees ${productCount} products!`);
            // artificially fail a test if RLS leaked
            results.summary.failed++;
            results.summary.passed--;
        }
    }

    // Write report
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\nTest run complete.`);
    console.log(`Results saved to: ${reportPath}`);
}

runAll();
