import 'dotenv/config';
import { prisma } from '../apps/backend/src/prismaClient.js';
const permissions = [
    { code: 'product.create', name: 'Create Product', module: 'Product', description: 'Allows creation of products' },
    { code: 'product.read', name: 'Read Product', module: 'Product', description: 'Allows viewing of products' },
    { code: 'product.update', name: 'Update Product', module: 'Product', description: 'Allows updating of products' },
    { code: 'product.delete', name: 'Delete Product', module: 'Product', description: 'Allows deletion of products' },
    
    { code: 'category.create', name: 'Create Category', module: 'Category', description: 'Allows creation of categories' },
    { code: 'category.read', name: 'Read Category', module: 'Category', description: 'Allows viewing of categories' },
    { code: 'category.update', name: 'Update Category', module: 'Category', description: 'Allows updating of categories' },
    { code: 'category.delete', name: 'Delete Category', module: 'Category', description: 'Allows deletion of categories' },

    { code: 'attribute.create', name: 'Create Attribute', module: 'Attribute', description: 'Allows creation of attributes' },
    { code: 'attribute.read', name: 'Read Attribute', module: 'Attribute', description: 'Allows viewing of attributes' },
    { code: 'attribute.update', name: 'Update Attribute', module: 'Attribute', description: 'Allows updating of attributes' },
    { code: 'attribute.delete', name: 'Delete Attribute', module: 'Attribute', description: 'Allows deletion of attributes' },

    { code: 'brand.create', name: 'Create Brand', module: 'Brand', description: 'Allows creation of brands' },
    { code: 'brand.read', name: 'Read Brand', module: 'Brand', description: 'Allows viewing of brands' },
    { code: 'brand.update', name: 'Update Brand', module: 'Brand', description: 'Allows updating of brands' },
    { code: 'brand.delete', name: 'Delete Brand', module: 'Brand', description: 'Allows deletion of brands' },

    { code: 'asset.create', name: 'Create Asset', module: 'Asset', description: 'Allows creation of assets' },
    { code: 'asset.read', name: 'Read Asset', module: 'Asset', description: 'Allows viewing of assets' },
    { code: 'asset.update', name: 'Update Asset', module: 'Asset', description: 'Allows updating of assets' },
    { code: 'asset.delete', name: 'Delete Asset', module: 'Asset', description: 'Allows deletion of assets' },

    { code: 'audit.read', name: 'Read Audit Logs', module: 'Audit', description: 'Allows viewing of audit logs' },

    { code: 'user.create', name: 'Create User', module: 'User', description: 'Allows creation of users' },
    { code: 'user.read', name: 'Read User', module: 'User', description: 'Allows viewing of users' },
    { code: 'user.update', name: 'Update User', module: 'User', description: 'Allows updating of users' },
    { code: 'user.delete', name: 'Delete User', module: 'User', description: 'Allows deletion of users' },
    
    { code: 'tenant.manage', name: 'Manage Tenant', module: 'Tenant', description: 'Master tenant administration' },
];

async function main() {
    console.log('Seeding permissions...');
    
    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { code: perm.code },
            update: {
                name: perm.name,
                module: perm.module,
                description: perm.description
            },
            create: {
                code: perm.code,
                name: perm.name,
                module: perm.module,
                description: perm.description
            }
        });
    }

    console.log('Permissions seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
