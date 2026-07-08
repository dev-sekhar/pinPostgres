import { prisma } from '../src/prismaClient.js';

async function setup() {
    console.log("Adding Master Data permissions...");
    
    const permissions = [
        { code: 'supplier.read', name: 'Read Supplier', module: 'MASTER_DATA' },
        { code: 'supplier.create', name: 'Create Supplier', module: 'MASTER_DATA' },
        { code: 'supplier.update', name: 'Update Supplier', module: 'MASTER_DATA' },
        { code: 'supplier.delete', name: 'Delete Supplier', module: 'MASTER_DATA' },
        { code: 'manufacturer.read', name: 'Read Manufacturer', module: 'MASTER_DATA' },
        { code: 'manufacturer.create', name: 'Create Manufacturer', module: 'MASTER_DATA' },
        { code: 'manufacturer.update', name: 'Update Manufacturer', module: 'MASTER_DATA' },
        { code: 'manufacturer.delete', name: 'Delete Manufacturer', module: 'MASTER_DATA' },
        { code: 'complianceType.read', name: 'Read Compliance Type', module: 'MASTER_DATA' },
        { code: 'complianceType.create', name: 'Create Compliance Type', module: 'MASTER_DATA' },
        { code: 'complianceType.update', name: 'Update Compliance Type', module: 'MASTER_DATA' },
        { code: 'complianceType.delete', name: 'Delete Compliance Type', module: 'MASTER_DATA' },
        { code: 'channel.read', name: 'Read Channel', module: 'MASTER_DATA' },
        { code: 'channel.create', name: 'Create Channel', module: 'MASTER_DATA' },
        { code: 'channel.update', name: 'Update Channel', module: 'MASTER_DATA' },
        { code: 'channel.delete', name: 'Delete Channel', module: 'MASTER_DATA' }
    ];

    for (const p of permissions) {
        await prisma.permission.upsert({
            where: { code: p.code },
            update: { name: p.name, module: p.module },
            create: p
        });
    }

    console.log("Permissions added!");
}

setup()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
