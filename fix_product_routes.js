const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'apps/backend/src/productRoutes.ts');
let content = fs.readFileSync(file, 'utf8');

// 1. Add `status` extraction to POST
content = content.replace(
    'const { name, description, price, parentId, attributes, productFamilyId, brandId, supplierId, manufacturerId, complianceTypeIds, channelIds } = req.body;',
    'const { name, description, price, parentId, attributes, productFamilyId, brandId, supplierId, manufacturerId, complianceTypeIds, channelIds, status } = req.body;'
);

// 2. Add `status` to `tx.product.create`
const searchCreate = `
            const newProduct = await tx.product.create({
                data: { 
                    sku: finalSku, 
                    name, 
                    description, 
                    price, 
                    parentId, 
                    attributes, 
                    productFamilyId, 
                    brandId, 
                    supplierId,
                    manufacturerId,
                    tenantId: req.user!.tenantId,`;

const replaceCreate = `
            const newProduct = await tx.product.create({
                data: { 
                    sku: finalSku, 
                    name, 
                    description, 
                    price, 
                    parentId, 
                    attributes, 
                    productFamilyId, 
                    brandId, 
                    supplierId,
                    manufacturerId,
                    status,
                    tenantId: req.user!.tenantId,`;

content = content.replace(searchCreate, replaceCreate);

// 3. Add PATCH /:id/status endpoint if not exists
const patchStatus = `
// PATCH /api/products/:id/status
router.patch("/:id/status", requirePermission("product.status.update") as any, async (req: AuthRequest, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required" });

    try {
        const product = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const existing = await tx.product.findUnique({ where: { id: req.params.id, deletedAt: null } });
            if (!existing) throw new Error("Product not found");

            const updated = await tx.product.update({
                where: { id: req.params.id },
                data: { status }
            });

            await auditService.logEvent(tx, {
                tenantId: req.user!.tenantId,
                userId: req.user!.userId,
                entityType: 'Product',
                entityId: updated.id,
                operation: 'UPDATE',
                beforeState: existing,
                afterState: updated,
                remarks: \`Status changed to \${status}\`,
                auditMeta: (req as any).auditMeta
            });
            return updated;
        });
        res.json(product);
    } catch (error: any) {
        console.error("Error updating product status:", error);
        res.status(500).json({ error: "Failed to update product status" });
    }
});

export default router;
`;

if (!content.includes('PATCH /api/products/:id/status')) {
    content = content.replace('export default router;', patchStatus);
}

fs.writeFileSync(file, content);
console.log('Updated productRoutes.ts');
