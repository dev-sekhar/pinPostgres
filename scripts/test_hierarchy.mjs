import fs from 'fs';
import path from 'path';

const API_BASE = 'http://127.0.0.1:3001/api'; // Notice port is 3001 for backend

async function runTests() {
    const results = [];
    
    function logResult(name, status, details = '') {
        const result = { test: name, status, details, time: new Date().toISOString() };
        results.push(result);
        console.log(`[${status}] ${name} ${details ? '- ' + details : ''}`);
    }

    try {
        console.log('Starting Hierarchy Automated Tests...');

        // 1. Register a tenant to get an admin user
        const companyName = `TestCompany_${Date.now()}`;
        const adminEmail = `admin_${Date.now()}@test.com`;
        
        const registerRes = await fetch(`${API_BASE}/auth/register-tenant`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                companyName,
                adminName: 'Admin',
                adminEmail,
                adminPassword: 'password123'
            })
        });
        
        if (!registerRes.ok) throw new Error('Failed to register tenant');
        logResult('Register Tenant', 'PASS');

        // 2. Login as admin
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: adminEmail, password: 'password123' })
        });
        const loginData = await loginRes.json();
        const adminToken = loginData.token;
        if (!adminToken) throw new Error('Failed to login admin');
        logResult('Admin Login', 'PASS');

        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` };

        // 3. Create Domain
        const domainRes = await fetch(`${API_BASE}/domains`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: 'Electronics', description: 'All electronic items' })
        });
        const domainData = await domainRes.json();
        if (domainRes.ok && domainData.id) logResult('Create Domain', 'PASS');
        else throw new Error('Failed to create domain: ' + JSON.stringify(domainData));

        // 4. Create Category
        const catRes = await fetch(`${API_BASE}/categories`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: 'Mobile Phones', domainId: domainData.id })
        });
        const catData = await catRes.json();
        if (catRes.ok && catData.id) logResult('Create Category', 'PASS');
        else throw new Error('Failed to create category: ' + JSON.stringify(catData));

        // 5. Create Subcategory
        const subCatRes = await fetch(`${API_BASE}/categories`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: 'Smartphones', domainId: domainData.id, parentId: catData.id })
        });
        const subCatData = await subCatRes.json();
        if (subCatRes.ok && subCatData.id) logResult('Create Subcategory', 'PASS');
        else throw new Error('Failed to create subcategory: ' + JSON.stringify(subCatData));

        // 6. Create Product Family
        const famRes = await fetch(`${API_BASE}/product-families`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: 'Android Smartphones', categoryId: subCatData.id })
        });
        const famData = await famRes.json();
        if (famRes.ok && famData.id) logResult('Create Product Family', 'PASS');
        else throw new Error('Failed to create product family: ' + JSON.stringify(famData));

        // 7. Fetch Product Families
        const getFamRes = await fetch(`${API_BASE}/product-families`, { headers });
        const getFamData = await getFamRes.json();
        if (getFamRes.ok && Array.isArray(getFamData) && getFamData.length > 0) logResult('Fetch Product Families', 'PASS');
        else throw new Error('Failed to fetch product families');

    } catch (error) {
        logResult('Test Execution Error', 'FAIL', error.message);
    } finally {
        // Write report
        const reportsDir = path.join(process.cwd(), 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const today = new Date();
        const prefix = today.toISOString().slice(0,10).replace(/-/g, '');
        
        // Find existing reports for today to determine 'n'
        const existingFiles = fs.readdirSync(reportsDir).filter(f => f.startsWith(prefix));
        let maxN = 0;
        for (const file of existingFiles) {
            const match = file.match(new RegExp(`${prefix}_(\\d+)\\.json`));
            if (match) {
                const n = parseInt(match[1]);
                if (n > maxN) maxN = n;
            }
        }
        const n = maxN + 1;
        
        const reportPath = path.join(reportsDir, `${prefix}_${n}.json`);
        const report = {
            suite: 'Product Classification Hierarchy Tests',
            timestamp: new Date().toISOString(),
            total: results.length,
            passed: results.filter(r => r.status === 'PASS').length,
            failed: results.filter(r => r.status === 'FAIL').length,
            results
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\nTest report saved to: ${reportPath}`);
    }
}

runTests();
