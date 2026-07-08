import { Router } from "express";
import { prisma, withTenantTransaction } from "./prismaClient.js";
import { requireAuth, AuthRequest } from "./authMiddleware.js";
import { auditService } from "./services/auditService.js";
import { skuService } from "./services/skuService.js";
import { requirePermission } from "./rbacMiddleware.js";

const router = Router();

router.use(requireAuth as any);

// GET /api/products
router.get("/", requirePermission("product.read") as any, async (req: AuthRequest, res) => {
    const products = await withTenantTransaction(req.user!.tenantId, async (tx) => {
                return tx.product.findMany({
                    where: { deletedAt: null, parentId: null },
                    take: 50,
                    orderBy: { createdAt: "desc" },
                });
            });
    res.json(products);
});

// GET /api/products/next-sku
router.get("/next-sku", requirePermission("product.create") as any, async (req: AuthRequest, res) => {
    const nextSku = await withTenantTransaction(req.user!.tenantId, async (tx) => {
                return await skuService.previewNextSku(tx, req.user!.tenantId);
            });
    res.json({ nextSku });
});

// GET /api/products/:parentId/next-variant-sku
router.get("/:parentId/next-variant-sku", requirePermission("product.create") as any, async (req: AuthRequest, res) => {
    try {
        const nextSku = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const parent = await tx.product.findUnique({ where: { id: req.params.parentId } });
            if (!parent) throw new Error("PARENT_NOT_FOUND");
            return await skuService.previewNextVariantSku(tx, req.user!.tenantId, parent.sku);
        });
        res.json({ nextSku });
    } catch (error: any) {
        console.error("Error previewing next variant SKU:", error);
        if (error.message === 'PARENT_NOT_FOUND') return res.status(404).json({ error: "Parent not found" });
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/products/:id
router.get("/:id", requirePermission("product.read") as any, async (req: AuthRequest, res) => {
    const product = await withTenantTransaction(req.user!.tenantId, async (tx) => {
                return tx.product.findUnique({
                    where: { id: req.params.id, deletedAt: null },
                    include: { 
                        variants: { where: { deletedAt: null } },
                        complianceTypes: true,
                        channels: true
                    }
                });
            });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
});



// POST /api/products
router.post("/", requirePermission("product.create") as any, async (req: AuthRequest, res) => {
    const { name, description, price, parentId, attributes, productFamilyId, brandId, supplierId, manufacturerId, complianceTypeIds, channelIds, status } = req.body;
    if (!name || price === undefined || !productFamilyId) {
        return res.status(400).json({ error: "Missing required fields (name, price, productFamilyId)" });
    }
    try {
        const product = await withTenantTransaction(req.user!.tenantId, async (tx) => {


            let finalSku = "";

            if (parentId) {
                const parent = await tx.product.findUnique({ where: { id: parentId } });
                if (!parent) throw new Error("PARENT_NOT_FOUND");
                finalSku = await skuService.generateAndClaimNextVariantSku(tx, req.user!.tenantId, parent.sku);
            } else {
                finalSku = await skuService.generateAndClaimNextSku(tx, req.user!.tenantId);
            }

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
                    tenantId: req.user!.tenantId,
                    complianceTypes: complianceTypeIds?.length ? {
                        create: complianceTypeIds.map((id: string) => ({ complianceTypeId: id }))
                    } : undefined,
                    channels: channelIds?.length ? {
                        create: channelIds.map((id: string) => ({ channelId: id }))
                    } : undefined
                },
                include: { complianceTypes: true, channels: true }
            });
            
            await auditService.logEvent(tx, {
                tenantId: req.user!.tenantId,
                userId: req.user!.userId,
                entityType: 'Product',
                entityId: newProduct.id,
                operation: 'CREATE',
                afterState: newProduct,
                auditMeta: (req as any).auditMeta
            });
            
            return newProduct;
        });

        res.status(201).json(product);
    } catch (error: any) {
        console.error("Error creating product:", error);
        if (error.message === 'PARENT_NOT_FOUND') {
            return res.status(400).json({ error: "Parent product not found" });
        }
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Product with this SKU already exists" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
});

// PUT /api/products/:id
router.put("/:id", requirePermission("product.update") as any, async (req: AuthRequest, res) => {
    const { name, description, price, attributes, productFamilyId, brandId, supplierId, manufacturerId, complianceTypeIds, channelIds } = req.body;
    if (!name || price === undefined || !productFamilyId) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        const product = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const existing = await tx.product.findUnique({ where: { id: req.params.id, deletedAt: null } });
            if (!existing) throw new Error("Product not found");

            const updated = await tx.product.update({
                where: { id: req.params.id },
                data: { 
                    name, 
                    description, 
                    price, 
                    attributes, 
                    productFamilyId,
                    brandId,
                    supplierId,
                    manufacturerId,
                    complianceTypes: complianceTypeIds !== undefined ? {
                        deleteMany: {},
                        create: complianceTypeIds.map((id: string) => ({ complianceTypeId: id }))
                    } : undefined,
                    channels: channelIds !== undefined ? {
                        deleteMany: {},
                        create: channelIds.map((id: string) => ({ channelId: id }))
                    } : undefined
                },
                include: { complianceTypes: true, channels: true }
            });

            await auditService.logEvent(tx, {
                tenantId: req.user!.tenantId,
                userId: req.user!.userId,
                entityType: 'Product',
                entityId: updated.id,
                operation: 'UPDATE',
                beforeState: existing,
                afterState: updated,
                auditMeta: (req as any).auditMeta
            });
            return updated;
        });
        res.json(product);
    } catch (error: any) {
        console.error("Error updating product:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Product with this SKU already exists" });
        }
        res.status(500).json({ error: "Failed to update product" });
    }
});

// PATCH /api/products/:id
router.patch("/:id", requirePermission("product.update") as any, async (req: AuthRequest, res) => {
    try {
        const product = await withTenantTransaction(req.user!.tenantId, async (tx) => {
            const existing = await tx.product.findUnique({ where: { id: req.params.id, deletedAt: null } });
            if (!existing) throw new Error("Product not found");

            const updateData = { ...req.body };
            delete updateData.sku; // Prevent modifying auto-generated SKU

            const updated = await tx.product.update({
                where: { id: req.params.id },
                data: updateData
            });

            await auditService.logEvent(tx, {
                tenantId: req.user!.tenantId,
                userId: req.user!.userId,
                entityType: 'Product',
                entityId: updated.id,
                operation: 'UPDATE',
                beforeState: existing,
                afterState: updated,
                auditMeta: (req as any).auditMeta
            });
            return updated;
        });
        res.json(product);
    } catch (error: any) {
        console.error("Error updating product:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Product with this SKU already exists" });
        }
        res.status(500).json({ error: "Failed to update product" });
    }
});

// DELETE /api/products/:id (Soft Delete)
router.delete("/:id", requirePermission("product.delete") as any, async (req: AuthRequest, res) => {
    await withTenantTransaction(req.user!.tenantId, async (tx) => {
                const existing = await tx.product.findUnique({ where: { id: req.params.id, deletedAt: null } });
                if (!existing) throw new Error("Product not found");

                const deleted = await tx.product.update({
                    where: { id: req.params.id },
                    data: { deletedAt: new Date() }
                });

                await auditService.logEvent(tx, {
                    tenantId: req.user!.tenantId,
                    userId: req.user!.userId,
                    entityType: 'Product',
                    entityId: deleted.id,
                    operation: 'DELETE',
                    beforeState: existing,
                    afterState: deleted,
                    auditMeta: (req as any).auditMeta
                });
                return deleted;
            });
    res.json({ message: "Product deleted successfully" });
});


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
                remarks: `Status changed to ${status}`,
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

