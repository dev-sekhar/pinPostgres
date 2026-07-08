import { Router } from "express";
import { prisma, withTenantTransaction } from "../prismaClient.js";
import { requireAuth, AuthRequest } from "../middleware/authMiddleware.js";

const router = Router();
router.use(requireAuth as any);

type EntityType = 'product' | 'brand' | 'supplier' | 'manufacturer' | 'complianceType' | 'channel';
const validEntities = ['product', 'brand', 'supplier', 'manufacturer', 'complianceType', 'channel'];

const getModelName = (entityType: string) => {
    switch (entityType) {
        case 'product': return 'productMedia';
        case 'brand': return 'brandMedia';
        case 'supplier': return 'supplierMedia';
        case 'manufacturer': return 'manufacturerMedia';
        case 'complianceType': return 'complianceTypeMedia';
        case 'channel': return 'channelMedia';
        default: return null;
    }
};

const getEntityIdField = (entityType: string) => `${entityType}Id`;

// GET /api/media/:entityType/:entityId
router.get("/:entityType/:entityId", async (req: AuthRequest, res, next) => {
    const { entityType, entityId } = req.params;
    if (!validEntities.includes(entityType)) return next(); // Might be an old route like /api/media/:id

    const modelName = getModelName(entityType);
    if (!modelName) return res.status(400).json({ error: "Invalid entity type" });

    const entityIdField = getEntityIdField(entityType);
    
    const media = await withTenantTransaction(req.user!.tenantId, async (tx) => {
        // @ts-ignore
        return tx[modelName].findMany({
            where: { [entityIdField]: entityId, deletedAt: null },
            orderBy: { sortOrder: "asc" }
        });
    });
    res.json(media);
});

// GET /api/media/:entityType/item/:id
router.get("/:entityType/item/:id", async (req: AuthRequest, res, next) => {
    const { entityType, id } = req.params;
    if (!validEntities.includes(entityType)) return next();

    const modelName = getModelName(entityType);
    if (!modelName) return res.status(400).json({ error: "Invalid entity type" });

    const media = await withTenantTransaction(req.user!.tenantId, async (tx) => {
        // @ts-ignore
        return tx[modelName].findUnique({
            where: { id, deletedAt: null }
        });
    });
    if (!media) return res.status(404).json({ error: "Media not found" });
    res.json(media);
});

// POST /api/media/:entityType
router.post("/:entityType", async (req: AuthRequest, res, next) => {
    const { entityType } = req.params;
    if (!validEntities.includes(entityType)) return next();

    const modelName = getModelName(entityType);
    if (!modelName) return res.status(400).json({ error: "Invalid entity type" });

    const entityIdField = getEntityIdField(entityType);
    const { url, altText, sortOrder, [entityIdField]: entityId, assetId } = req.body;
    
    if (!url || !entityId) {
        return res.status(400).json({ error: `Missing required fields (url, ${entityIdField})` });
    }

    const data: any = {
        url, altText, sortOrder: sortOrder || 0, [entityIdField]: entityId
    };
    if (assetId) data.assetId = assetId;
    
    if (!['manufacturer', 'complianceType'].includes(entityType)) {
        data.tenantId = req.user!.tenantId;
    }

    const media = await withTenantTransaction(req.user!.tenantId, async (tx) => {
        // @ts-ignore
        return tx[modelName].create({ data });
    });
    res.status(201).json(media);
});

// PUT /api/media/:entityType/:id
router.put("/:entityType/:id", async (req: AuthRequest, res, next) => {
    const { entityType, id } = req.params;
    if (!validEntities.includes(entityType)) return next();

    const modelName = getModelName(entityType);
    if (!modelName) return res.status(400).json({ error: "Invalid entity type" });

    const entityIdField = getEntityIdField(entityType);
    const { url, altText, sortOrder, [entityIdField]: entityId, assetId } = req.body;
    
    if (!url || !entityId) {
        return res.status(400).json({ error: `Missing required fields` });
    }

    const data: any = {
        url, altText, sortOrder, [entityIdField]: entityId
    };
    if (assetId !== undefined) data.assetId = assetId;

    const media = await withTenantTransaction(req.user!.tenantId, async (tx) => {
        // @ts-ignore
        return tx[modelName].update({
            where: { id, deletedAt: null },
            data
        });
    });
    res.json(media);
});

// PATCH /api/media/:entityType/:id
router.patch("/:entityType/:id", async (req: AuthRequest, res, next) => {
    const { entityType, id } = req.params;
    if (!validEntities.includes(entityType)) return next();

    const modelName = getModelName(entityType);
    if (!modelName) return res.status(400).json({ error: "Invalid entity type" });

    const media = await withTenantTransaction(req.user!.tenantId, async (tx) => {
        // @ts-ignore
        return tx[modelName].update({
            where: { id, deletedAt: null },
            data: req.body
        });
    });
    res.json(media);
});

// DELETE /api/media/:entityType/:id
router.delete("/:entityType/:id", async (req: AuthRequest, res, next) => {
    const { entityType, id } = req.params;
    if (!validEntities.includes(entityType)) return next();

    const modelName = getModelName(entityType);
    if (!modelName) return res.status(400).json({ error: "Invalid entity type" });

    await withTenantTransaction(req.user!.tenantId, async (tx) => {
        // @ts-ignore
        return tx[modelName].update({
            where: { id, deletedAt: null },
            data: { deletedAt: new Date() }
        });
    });
    res.json({ message: "Media deleted successfully" });
});


// =========================================================================
// BACKWARDS COMPATIBILITY ROUTES (Assume ProductMedia)
// =========================================================================

router.get("/:id", async (req: AuthRequest, res) => {
    const media = await withTenantTransaction(req.user!.tenantId, async (tx) => {
        return tx.productMedia.findUnique({
            where: { id: req.params.id, deletedAt: null }
        });
    });
    if (!media) return res.status(404).json({ error: "Media not found" });
    res.json(media);
});

router.post("/", async (req: AuthRequest, res) => {
    const { url, altText, sortOrder, productId, assetId } = req.body;
    if (!url || !productId) {
        return res.status(400).json({ error: "Missing required fields (url, productId)" });
    }
    const data: any = { url, altText, sortOrder: sortOrder || 0, productId, tenantId: req.user!.tenantId };
    if (assetId) data.assetId = assetId;

    const media = await withTenantTransaction(req.user!.tenantId, async (tx) => {
        return tx.productMedia.create({ data });
    });
    res.status(201).json(media);
});

router.put("/:id", async (req: AuthRequest, res) => {
    const { url, altText, sortOrder, productId, assetId } = req.body;
    if (!url || !productId) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    const data: any = { url, altText, sortOrder, productId };
    if (assetId !== undefined) data.assetId = assetId;

    const media = await withTenantTransaction(req.user!.tenantId, async (tx) => {
        return tx.productMedia.update({
            where: { id: req.params.id, deletedAt: null },
            data
        });
    });
    res.json(media);
});

router.patch("/:id", async (req: AuthRequest, res) => {
    const media = await withTenantTransaction(req.user!.tenantId, async (tx) => {
        return tx.productMedia.update({
            where: { id: req.params.id, deletedAt: null },
            data: req.body
        });
    });
    res.json(media);
});

router.delete("/:id", async (req: AuthRequest, res) => {
    await withTenantTransaction(req.user!.tenantId, async (tx) => {
        return tx.productMedia.update({
            where: { id: req.params.id, deletedAt: null },
            data: { deletedAt: new Date() }
        });
    });
    res.json({ message: "Media deleted successfully" });
});

export default router;
