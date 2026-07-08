const fs = require('fs');
const path = require('path');

const routes = [
    { file: 'brandRoutes.ts', entity: 'brand', model: 'brand', service: 'brandService.updateBrand' },
    { file: 'supplierRoutes.ts', entity: 'supplier', model: 'supplier', service: 'supplierService.updateSupplier' },
    { file: 'manufacturerRoutes.ts', entity: 'manufacturer', model: 'manufacturer', service: 'manufacturerService.updateManufacturer' },
    { file: 'channelRoutes.ts', entity: 'channel', model: 'channel', service: 'channelService.updateChannel' },
    { file: 'complianceTypeRoutes.ts', entity: 'complianceType', model: 'complianceType', service: 'complianceTypeService.updateComplianceType' },
    { file: 'categoryRoutes.ts', entity: 'category', model: 'category', service: 'categoryService.updateCategory' },
    { file: 'productFamilyRoutes.ts', entity: 'productFamily', model: 'productFamily', service: 'productFamilyService.updateProductFamily' },
    { file: 'domainRoutes.ts', entity: 'domain', model: 'domain', service: 'domainService.updateDomain' },
];

for (const r of routes) {
    const filePath = path.join(__dirname, 'apps/backend/src', r.file);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf8');

    // Check if the route is already there
    if (content.includes('PATCH /:id/status') || content.includes('patch("/:id/status"')) {
        continue;
    }

    const snippet = `
// PATCH /api/${r.entity}s/:id/status
router.patch("/:id/status", requirePermission("${r.entity}.status.update") as any, async (req: AuthRequest, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required" });

    try {
        const updated = await ${r.service}(
            req.user!.tenantId,
            req.user!.userId,
            req.params.id,
            { status },
            (req as any).auditMeta
        );
        if (!updated) return res.status(404).json({ error: "${r.entity} not found" });
        res.json(updated);
    } catch (error: any) {
        console.error("Error updating ${r.entity} status:", error);
        res.status(500).json({ error: "Failed to update ${r.entity} status" });
    }
});

`;

    // Insert before 'export default router;'
    content = content.replace('export default router;', snippet + 'export default router;');
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${r.file}`);
}
