import boss from "./pgBoss.js";
import { prisma } from "./prismaClient.js";
import { auditService } from "./services/auditService.js";
import { skuService } from "./services/skuService.js";
import { validationService } from "./services/validationService.js";
import fs from "fs";
import csv from "csv-parser";

export const startWorker = async () => {
    console.log("Starting pg-boss worker...");
    await boss.createQueue('import-jobs').catch(() => {}); // Create if not exists
    await boss.work('import-jobs', async (jobs) => {
        // Handle both batch (array) and single job payload
        const jobsArray = Array.isArray(jobs) ? jobs : [jobs];
        
        for (const job of jobsArray) {
            const { jobId, tenantId, filePath, mappingConfig, type, userId } = job.data as any;

            try {
                await prisma.job.update({
                    where: { id: jobId },
                    data: { status: "PROCESSING" }
                });

                if (type === 'IMPORT_PRODUCTS') {
                    await processProductImport(jobId, tenantId, filePath, mappingConfig);
                } else {
                    throw new Error(`Unsupported job type: ${type}`);
                }

                await prisma.job.update({
                    where: { id: jobId },
                    data: { status: "COMPLETED" }
                });

                if (userId) {
                    await auditService.logEvent(prisma, {
                        tenantId,
                        userId,
                        operation: "IMPORT",
                        entityType: "Product",
                        entityId: jobId,
                        afterState: { type, status: "COMPLETED" },
                        auditMeta: { source: "SYSTEM" }
                    });
                }
            } catch (error: any) {
                console.error(`Job ${jobId} failed:`, error);
                await prisma.job.update({
                    where: { id: jobId },
                    data: { 
                        status: "FAILED", 
                        errorLog: { globalError: error.message }
                    }
                });

                if (userId) {
                    await auditService.logEvent(prisma, {
                        tenantId,
                        userId,
                        operation: "IMPORT",
                        entityType: "Product",
                        entityId: jobId,
                        afterState: { type, status: "FAILED", error: error.message },
                        auditMeta: { source: "SYSTEM" }
                    });
                }
            }
        }
    });
};

const processProductImport = (jobId: string, tenantId: string, filePath: string, mappingConfig: any): Promise<void> => {
    return new Promise((resolve, reject) => {
        let processedRows = 0;
        let failedRows = 0;
        let totalRows = 0;
        const errorLog: any[] = [];
        
        const results: any[] = [];
        
        const stream = fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                results.push(data);
                totalRows++;
            })
            .on('end', async () => {
                try {
                    await prisma.job.update({ where: { id: jobId }, data: { totalRows } });

                    // Memoize master data queries
                    const cache: any = { brands: {}, suppliers: {}, manufacturers: {}, channels: {}, complianceTypes: {}, productFamilies: {} };

                    const resolveMasterData = async (model: any, code: string, cacheKey: string) => {
                        if (!code) return null;
                        if (cache[cacheKey][code]) return cache[cacheKey][code];
                        const record = await model.findFirst({ where: { OR: [{ code }, { name: code }], tenantId } });
                        if (record) cache[cacheKey][code] = record.id;
                        return record?.id || null;
                    };

                    for (const row of results) {
                        try {
                            const name = row[mappingConfig.name];
                            if (!name) throw new Error("Missing required field: Name");

                            // Resolve Product Family if provided in CSV (takes precedence over UI selection)
                            let productFamilyId = mappingConfig.productFamilyId || null;
                            if (mappingConfig.productFamilyCode && row[mappingConfig.productFamilyCode]) {
                                const resolved = await resolveMasterData(prisma.productFamily, row[mappingConfig.productFamilyCode], 'productFamilies');
                                if (!resolved) throw new Error(`Product Family not found: ${row[mappingConfig.productFamilyCode]}`);
                                productFamilyId = resolved;
                            }

                            // Resolve Master Data
                            const brandId = mappingConfig.brandCode ? await resolveMasterData(prisma.brand, row[mappingConfig.brandCode], 'brands') : undefined;
                            const supplierId = mappingConfig.supplierCode ? await resolveMasterData(prisma.supplier, row[mappingConfig.supplierCode], 'suppliers') : undefined;
                            const manufacturerId = mappingConfig.manufacturerCode ? await resolveMasterData(prisma.manufacturer, row[mappingConfig.manufacturerCode], 'manufacturers') : undefined;
                            
                            // Parse price
                            const priceStr = mappingConfig.price ? row[mappingConfig.price] : null;
                            const price = priceStr ? parseFloat(priceStr) : 0;
                            if (isNaN(price) || price < 0) throw new Error("Price must be a valid positive number");

                            // Validate Channels
                            const channelIds = [];
                            if (mappingConfig.channelCodes && row[mappingConfig.channelCodes]) {
                                const codes = row[mappingConfig.channelCodes].split(',').map((c: string) => c.trim());
                                for (const code of codes) {
                                    const cId = await resolveMasterData(prisma.channel, code, 'channels');
                                    if (cId) channelIds.push(cId);
                                }
                            }

                            // Validate Compliance Types
                            const complianceTypeIds = [];
                            if (mappingConfig.complianceTypeCodes && row[mappingConfig.complianceTypeCodes]) {
                                const codes = row[mappingConfig.complianceTypeCodes].split(',').map((c: string) => c.trim());
                                for (const code of codes) {
                                    const cId = await resolveMasterData(prisma.complianceType, code, 'complianceTypes');
                                    if (cId) complianceTypeIds.push(cId);
                                }
                            }

                            // Extract dynamic attributes
                            const attributes: any = {};
                            if (mappingConfig.attributes) {
                                for (const [attrCode, csvColumn] of Object.entries(mappingConfig.attributes)) {
                                    if (row[csvColumn as string]) {
                                        attributes[attrCode] = row[csvColumn as string];
                                    }
                                }
                            }

                            // Note: we can't fully use validateFormat yet because it requires SKU, 
                            // which we generate during insert. We'll generate SKU now.
                            // Ideally this should be a transaction but pg-boss concurrency needs care.
                            const sku = row.sku || await skuService.generateAndClaimNextSku(prisma as any, tenantId);

                            // The constructed payload for validation and saving
                            const payload = {
                                tenantId,
                                sku,
                                name,
                                description: mappingConfig.description ? (row[mappingConfig.description] || '') : '',
                                price,
                                productFamilyId,
                                attributes,
                                brandId,
                                supplierId,
                                manufacturerId,
                                status: "ACTIVE"
                            };

                            // Run JSON schema validation
                            const formatErrors = validationService.validateFormat("Product", payload);
                            if (formatErrors) {
                                throw new Error(`Validation Error: ${formatErrors.map((e: any) => e.message).join(', ')}`);
                            }

                            // Persist
                            const newProduct = await prisma.product.upsert({
                                where: { tenantId_sku: { tenantId, sku } },
                                update: payload,
                                create: payload
                            });

                            // Link associations
                            if (channelIds.length > 0) {
                                await prisma.productChannel.deleteMany({ where: { productId: newProduct.id } });
                                await prisma.productChannel.createMany({
                                    data: channelIds.map(channelId => ({ productId: newProduct.id, channelId }))
                                });
                            }
                            if (complianceTypeIds.length > 0) {
                                await prisma.productComplianceType.deleteMany({ where: { productId: newProduct.id } });
                                await prisma.productComplianceType.createMany({
                                    data: complianceTypeIds.map(complianceTypeId => ({ productId: newProduct.id, complianceTypeId }))
                                });
                            }

                            processedRows++;
                        } catch (err: any) {
                            failedRows++;
                            errorLog.push({ row, error: err.message });
                        }

                        if ((processedRows + failedRows) % 10 === 0) {
                            await prisma.job.update({ where: { id: jobId }, data: { processedRows, failedRows } });
                        }
                    }

                    await prisma.job.update({
                        where: { id: jobId },
                        data: { 
                            processedRows, 
                            failedRows, 
                            ...(errorLog.length > 0 ? { errorLog } : {}) 
                        }
                    });

                    resolve();
                } catch (err) {
                    reject(err);
                }
            })
            .on('error', reject);
    });
};
