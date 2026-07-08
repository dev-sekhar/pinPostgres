import { saveReport } from './reportUtils.mjs';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://127.0.0.1:3001/api';

async function runTests() {
    const results = [];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    function logResult(name, status, details = '') {
        const result = { test: name, status, details, time: new Date().toISOString() };
        results.push(result);
        console.log(`[${status}] ${name} ${details ? '- ' + details : ''}`);
    }

    try {
        console.log('Starting RBAC automated tests...');

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

        // 3. Create a new user
        const userEmail = `user_${Date.now()}@test.com`;
        const createUserRes = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
            body: JSON.stringify({
                name: 'Test User',
                email: userEmail,
                password: 'password123',
                roleIds: [] // No roles initially
            })
        });
        const userData = await createUserRes.json();
        if (!createUserRes.ok) throw new Error('Failed to create user');
        logResult('Create User', 'PASS');

        // 4. Login as new user
        const userLoginRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, password: 'password123' })
        });
        const userLoginData = await userLoginRes.json();
        const userToken = userLoginData.token;
        if (!userToken) throw new Error('Failed to login new user');
        logResult('User Login', 'PASS');

        // 5. Try to access products API with new user (should fail 403)
        const productsFailRes = await fetch(`${API_BASE}/products`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        if (productsFailRes.status === 403) {
            logResult('Access Products Without Permission', 'PASS', 'Correctly denied access with 403');
        } else {
            logResult('Access Products Without Permission', 'FAIL', `Expected 403, got ${productsFailRes.status}`);
            throw new Error('Access control failure');
        }

        // 6. Admin creates a role with product.read permission
        // First get permissions to find product.read
        const permsRes = await fetch(`${API_BASE}/roles/permissions/all`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const allPerms = await permsRes.json();
        const productReadPerm = allPerms.find(p => p.code === 'product.read');
        
        if (!productReadPerm) throw new Error('product.read permission not found');

        const createRoleRes = await fetch(`${API_BASE}/roles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
            body: JSON.stringify({
                name: 'Product Reader',
                description: 'Can read products',
                permissionIds: [productReadPerm.id]
            })
        });
        const roleData = await createRoleRes.json();
        if (!createRoleRes.ok) throw new Error('Failed to create role');
        logResult('Create Custom Role', 'PASS');

        // 7. Admin assigns role to the user
        const updateUserRes = await fetch(`${API_BASE}/users/${userData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
            body: JSON.stringify({
                name: userData.name,
                email: userData.email,
                roleIds: [roleData.id]
            })
        });
        if (!updateUserRes.ok) throw new Error('Failed to assign role to user');
        logResult('Assign Role To User', 'PASS');

        // 8. Try to access products API again with new user (should succeed 200)
        const productsSuccessRes = await fetch(`${API_BASE}/products`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        if (productsSuccessRes.status === 200) {
            logResult('Access Products With Permission', 'PASS', 'Correctly allowed access with 200');
        } else {
            logResult('Access Products With Permission', 'FAIL', `Expected 200, got ${productsSuccessRes.status}`);
        }

    } catch (error) {
        logResult('Test Execution Error', 'FAIL', error.message);
    } finally {
        // Write report
        const reportsDir = path.join(process.cwd(), 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const reportPath = path.join(reportsDir, `rbac_test_report_${timestamp}.json`);
        const report = {
            suite: 'RBAC Automation Tests',
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
