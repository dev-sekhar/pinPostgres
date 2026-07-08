import { prisma } from '../src/prismaClient.js';
import { brandService } from '../src/services/brandService.js';
import { supplierService } from '../src/services/supplierService.js';
import { manufacturerService } from '../src/services/manufacturerService.js';
import { complianceTypeService } from '../src/services/complianceTypeService.js';
import { channelService } from '../src/services/channelService.js';
import fs from 'fs';
import path from 'path';

async function runTests() {
    console.log("Starting Master Data Automation Tests...");
    const report = {
        timestamp: new Date().toISOString(),
        totalTests: 0,
        passed: 0,
        failed: 0,
        results: [] as any[]
    };

    const addResult = (name: string, passed: boolean, error?: any) => {
        report.totalTests++;
        if (passed) report.passed++;
        else report.failed++;
        report.results.push({ name, passed, error: error?.message || error });
        console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}`);
        if (error) console.error(error);
    };

    try {
        // Find a tenant
        const tenant = await prisma.tenant.findFirst();
        if (!tenant) {
            throw new Error("No tenant found for testing.");
        }

        let user = await prisma.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenant.id}, true)`;
            let existingUser = await tx.user.findFirst();
            if (existingUser) return existingUser;
            
            return tx.user.create({
                data: {
                    email: 'test@admin.com',
                    password: 'dummy',
                    name: 'Test Admin',
                    tenantId: tenant.id
                }
            });
        });
        const sysUserId = user.id;

        // Cleanup previous runs if they failed
        const existingSupp = await prisma.supplier.findFirst({ where: { tenantId: tenant.id, code: 'TEST-SUPP' }});
        if (existingSupp) await prisma.supplier.delete({ where: { id: existingSupp.id }});

        const existingMfg = await prisma.manufacturer.findUnique({ where: { code: 'TEST-MFG' }});
        if (existingMfg) await prisma.manufacturer.delete({ where: { id: existingMfg.id }});

        const existingComp = await prisma.complianceType.findUnique({ where: { code: 'TEST-COMP' }});
        if (existingComp) await prisma.complianceType.delete({ where: { id: existingComp.id }});

        const existingChan = await prisma.channel.findFirst({ where: { tenantId: tenant.id, code: 'TEST-CHAN' }});
        if (existingChan) await prisma.channel.delete({ where: { id: existingChan.id }});

        const existingFam = await prisma.productFamily.findFirst({ where: { tenantId: tenant.id, name: 'Test Master Family' }});
        if (existingFam) await prisma.productFamily.delete({ where: { id: existingFam.id }});

        const existingCat = await prisma.category.findFirst({ where: { tenantId: tenant.id, name: 'Test Master Category' }});
        if (existingCat) await prisma.category.delete({ where: { id: existingCat.id }});
        
        const existingDom = await prisma.domain.findFirst({ where: { tenantId: tenant.id, name: 'Test Master Domain' }});
        if (existingDom) await prisma.domain.delete({ where: { id: existingDom.id }});

        // --- Supplier Tests ---
        let supplierId = '';
        try {
            const supplier = await supplierService.createSupplier(tenant.id, sysUserId, {
                code: 'TEST-SUPP',
                name: 'Test Supplier',
                description: 'A test supplier',
                contactInfo: { email: 'test@supplier.com' },
                status: 'ACTIVE'
            });
            supplierId = supplier.id;
            addResult('Create Supplier', true);
        } catch (e) { addResult('Create Supplier', false, e); }

        try {
            const suppliers = await supplierService.getSuppliers(tenant.id);
            addResult('Get Suppliers', suppliers.some(s => s.id === supplierId));
        } catch (e) { addResult('Get Suppliers', false, e); }

        try {
            await supplierService.updateSupplier(tenant.id, sysUserId, supplierId, { name: 'Updated Supplier' });
            const s = await supplierService.getSupplierById(tenant.id, supplierId);
            addResult('Update Supplier', s?.name === 'Updated Supplier');
        } catch (e) { addResult('Update Supplier', false, e); }

        // --- Manufacturer Tests ---
        let mfgId = '';
        try {
            const mfg = await manufacturerService.createManufacturer(tenant.id, sysUserId, {
                code: 'TEST-MFG',
                name: 'Test Manufacturer',
                description: 'A test manufacturer',
                status: 'ACTIVE'
            });
            mfgId = mfg.id;
            addResult('Create Manufacturer', true);
        } catch (e) { addResult('Create Manufacturer', false, e); }

        try {
            const mfgs = await manufacturerService.getManufacturers();
            addResult('Get Manufacturers', mfgs.some(m => m.id === mfgId));
        } catch (e) { addResult('Get Manufacturers', false, e); }

        // --- Compliance Type Tests ---
        let compId = '';
        try {
            const comp = await complianceTypeService.createComplianceType(tenant.id, sysUserId, {
                code: 'TEST-COMP',
                name: 'Test Compliance',
                status: 'ACTIVE'
            });
            compId = comp.id;
            addResult('Create Compliance Type', true);
        } catch (e) { addResult('Create Compliance Type', false, e); }

        try {
            const comps = await complianceTypeService.getComplianceTypes();
            addResult('Get Compliance Types', comps.some(c => c.id === compId));
        } catch (e) { addResult('Get Compliance Types', false, e); }

        // --- Channel Tests ---
        let channelId = '';
        try {
            const chan = await channelService.createChannel(tenant.id, sysUserId, {
                code: 'TEST-CHAN',
                name: 'Test Channel',
                status: 'ACTIVE'
            });
            channelId = chan.id;
            addResult('Create Channel', true);
        } catch (e) { addResult('Create Channel', false, e); }

        try {
            const chans = await channelService.getChannels(tenant.id);
            addResult('Get Channels', chans.some(c => c.id === channelId));
        } catch (e) { addResult('Get Channels', false, e); }

        // --- Product Test with Master Data ---
        let productId = '';
        let domainId = '', categoryId = '', familyId = '';
        try {
            // Need domain, category, family first
            const dom = await prisma.domain.create({ data: { tenantId: tenant.id, name: 'Test Master Domain' } });
            domainId = dom.id;
            const cat = await prisma.category.create({ data: { tenantId: tenant.id, domainId, name: 'Test Master Category' } });
            categoryId = cat.id;
            const fam = await prisma.productFamily.create({ data: { tenantId: tenant.id, categoryId, name: 'Test Master Family' } });
            familyId = fam.id;

            const p = await prisma.$transaction(async (tx) => {
                await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenant.id}, true)`;
                return tx.product.create({
                    data: {
                        sku: 'TEST-PROD-MD',
                        name: 'Master Data Test Product',
                        description: 'A test product with all master data fields',
                        price: 15.99,
                        productFamilyId: familyId,
                        attributes: {},
                        supplierId,
                        manufacturerId: mfgId,
                        tenantId: tenant.id,
                        complianceTypes: {
                            create: [{ complianceTypeId: compId }]
                        },
                        channels: {
                            create: [{ channelId: channelId }]
                        }
                    }
                });
            });

            if (p && p.id) {
                productId = p.id;
                addResult('Create Product with Master Data', true);
            } else {
                addResult('Create Product with Master Data', false, 'Missing Product ID');
            }
        } catch (e) { addResult('Create Product with Master Data', false, e); }

        // Clean up
        try {
            if (productId) {
                await prisma.$transaction(async (tx) => {
                    await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenant.id}, true)`;
                    await tx.product.delete({ where: { id: productId } });
                });
            }
            if (familyId) await prisma.productFamily.delete({ where: { id: familyId } });
            if (categoryId) await prisma.category.delete({ where: { id: categoryId } });
            if (domainId) await prisma.domain.delete({ where: { id: domainId } });
            if (supplierId) await supplierService.deleteSupplier(tenant.id, sysUserId, supplierId);
            if (mfgId) await manufacturerService.deleteManufacturer(tenant.id, sysUserId, mfgId);
            if (compId) await complianceTypeService.deleteComplianceType(tenant.id, sysUserId, compId);
            if (channelId) await channelService.deleteChannel(tenant.id, sysUserId, channelId);
            addResult('Cleanup Test Data', true);
        } catch (e) { addResult('Cleanup Test Data', false, e); }

    } catch (err: any) {
        console.error("Test execution failed:", err);
        addResult('Overall Execution', false, err);
    }

    // Save report
    const reportPath = path.resolve(process.cwd(), '../../reports');
    if (!fs.existsSync(reportPath)) {
        fs.mkdirSync(reportPath, { recursive: true });
    }
    const filename = path.join(reportPath, `master-data-test-report-${Date.now()}.json`);
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    
    console.log(`\nTests completed: ${report.passed}/${report.totalTests} passed.`);
    console.log(`Report saved to: ${filename}`);
}

runTests().finally(() => prisma.$disconnect());
