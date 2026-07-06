import "dotenv/config";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const permissions = [
        { code: "domain.read", name: "Read Domain", module: "Product", description: "Allows reading domain" },
        { code: "domain.create", name: "Create Domain", module: "Product", description: "Allows creating domain" },
        { code: "domain.update", name: "Update Domain", module: "Product", description: "Allows updating domain" },
        { code: "domain.delete", name: "Delete Domain", module: "Product", description: "Allows deleting domain" },
        
        { code: "category.read", name: "Read Category", module: "Product", description: "Allows reading category" },
        { code: "category.create", name: "Create Category", module: "Product", description: "Allows creating category" },
        { code: "category.update", name: "Update Category", module: "Product", description: "Allows updating category" },
        { code: "category.delete", name: "Delete Category", module: "Product", description: "Allows deleting category" },

        { code: "productFamily.read", name: "Read Product Family", module: "Product", description: "Allows reading product family" },
        { code: "productFamily.create", name: "Create Product Family", module: "Product", description: "Allows creating product family" },
        { code: "productFamily.update", name: "Update Product Family", module: "Product", description: "Allows updating product family" },
        { code: "productFamily.delete", name: "Delete Product Family", module: "Product", description: "Allows deleting product family" },
    ];

    console.log("Seeding new permissions...");
    for (const p of permissions) {
        await prisma.permission.upsert({
            where: { code: p.code },
            update: p,
            create: p
        });
    }
    console.log("Permissions seeded successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
