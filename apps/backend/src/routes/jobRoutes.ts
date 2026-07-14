import { Router } from "express";
import multer from "multer";
import fs from "fs";
import csv from "csv-parser";
import { requireAuth, AuthRequest } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/rbacMiddleware.js";
import { auditService } from "../services/auditService.js";
import { prisma } from "../prismaClient.js";
import boss from "../pgBoss.js";

const router = Router();
router.use(requireAuth as any);

const upload = multer({ dest: 'uploads/' });

// POST /api/jobs/upload
router.post("/upload", requirePermission("import.create") as any, upload.single('file') as any, async (req: AuthRequest, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const results: any[] = [];
    let headers: string[] = [];

    let count = 0;
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('headers', (headerList) => {
            headers = headerList;
        })
        .on('data', (data) => {
            if (count < 5) {
                results.push(data);
            }
            count++;
        })
        .on('end', () => {
            res.json({
                headers,
                sample: results,
                filePath: req.file!.path,
                originalName: req.file!.originalname
            });
        })
        .on('error', (err) => {
            res.status(500).json({ error: "Failed to parse CSV" });
        });
});

// POST /api/jobs/import
router.post("/import", requirePermission("import.create") as any, async (req: AuthRequest, res) => {
    const { filePath, mappingConfig, type } = req.body;
    
    if (!filePath || !mappingConfig || !type) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const jobRecord = await prisma.job.create({
        data: {
            tenantId: req.user!.tenantId,
            type,
            status: "PENDING",
            mappingConfig,
            fileUrl: filePath,
            createdBy: req.user!.userId
        }
    });

    await boss.send('import-jobs', {
        jobId: jobRecord.id,
        tenantId: req.user!.tenantId,
        filePath,
        mappingConfig,
        type,
        userId: req.user!.userId
    });

    await auditService.logEvent(prisma, {
        tenantId: req.user!.tenantId,
        userId: req.user!.userId,
        operation: "IMPORT",
        entityType: "Product",
        entityId: jobRecord.id,
        afterState: { type, status: "PENDING" },
        auditMeta: { source: "WEB" }
    });

    res.status(201).json(jobRecord);
});

// GET /api/jobs
router.get("/", requirePermission("import.read") as any, async (req: AuthRequest, res) => {
    const jobs = await prisma.job.findMany({
        where: { tenantId: req.user!.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 50
    });
    res.json(jobs);
});

// GET /api/jobs/:id
router.get("/:id", requirePermission("import.read") as any, async (req: AuthRequest, res) => {
    const job = await prisma.job.findUnique({
        where: { id: req.params.id, tenantId: req.user!.tenantId }
    });
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
});

// POST /api/jobs/:id/retry
router.post("/:id/retry", requirePermission("import.create") as any, async (req: AuthRequest, res) => {
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ error: "No rows provided to retry" });
    }
    
    const parentJob = await prisma.job.findUnique({
        where: { id: req.params.id, tenantId: req.user!.tenantId }
    });
    if (!parentJob) return res.status(404).json({ error: "Parent job not found" });

    // Generate CSV string from rows
    const header = Object.keys(rows[0]);
    const body = rows.map(r => 
        header.map(col => `"${(r[col] || '').toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const csvString = `${header.join(',')}\n${body}`;
    
    const filePath = `uploads/retry_${Date.now()}.csv`;
    fs.writeFileSync(filePath, csvString);

    const jobRecord = await prisma.job.create({
        data: {
            tenantId: req.user!.tenantId,
            type: parentJob.type,
            status: "PENDING",
            mappingConfig: parentJob.mappingConfig || {},
            fileUrl: filePath,
            createdBy: req.user!.userId
        }
    });

    await boss.send('import-jobs', {
        jobId: jobRecord.id,
        tenantId: req.user!.tenantId,
        filePath,
        mappingConfig: parentJob.mappingConfig,
        type: parentJob.type,
        userId: req.user!.userId
    });

    await auditService.logEvent(prisma, {
        tenantId: req.user!.tenantId,
        userId: req.user!.userId,
        operation: "IMPORT",
        entityType: "Product",
        entityId: jobRecord.id,
        afterState: { type: parentJob.type, status: "PENDING", retryFrom: parentJob.id },
        auditMeta: { source: "WEB" }
    });

    res.status(201).json(jobRecord);
});

export default router;
