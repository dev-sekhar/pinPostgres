import { PrismaClient, Prisma } from "../generated/prisma/client.js";
import { AppError } from "../utils/AppError.js";
import crypto from "crypto";



export const assetService = {
    async createAsset(tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">, tenantId: string, data: any) {
        const { name, url, metadata } = data;

        let checksum = "";
        let mimeType = "";
        let sizeBytes = 0;

        try {
            // Fetch URL to get the file buffer and compute checksum
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch asset from URL: ${response.statusText}`);
            }

            mimeType = response.headers.get("content-type") || "";
            const buffer = await response.arrayBuffer();
            sizeBytes = buffer.byteLength;

            // Algorithm config from .env (e.g. SHA-256 -> sha256)
            let alg = process.env.ASSET_CHECKSUM_ALGORITHM || "sha256";
            alg = alg.toLowerCase().replace("-", "");
            
            const hash = crypto.createHash(alg);
            hash.update(Buffer.from(buffer));
            checksum = hash.digest("hex");

        } catch (error: any) {
            throw new AppError(`Unable to process URL: ${error.message}`, 400);
        }

        // Check for duplicate checksum in this tenant
        const existing = await tx.asset.findUnique({
            where: {
                tenantId_checksum: {
                    tenantId,
                    checksum
                }
            }
        });

        if (existing) {
            throw new AppError("An asset with this exact content already exists in your repository.", 409);
        }

        return tx.asset.create({
            data: {
                tenantId,
                name,
                url,
                checksum,
                mimeType,
                sizeBytes,
                metadata: metadata || Prisma.JsonNull,
            }
        });
    },

    async getAssets(tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">, tenantId: string) {
        return tx.asset.findMany({
            where: { tenantId, deletedAt: null },
            orderBy: { createdAt: 'desc' }
        });
    },

    async getAssetById(tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">, tenantId: string, assetId: string) {
        const asset = await tx.asset.findUnique({
            where: { id: assetId }
        });
        if (!asset || asset.tenantId !== tenantId || asset.deletedAt) {
            throw new AppError("Asset not found", 404);
        }
        return asset;
    },

    async updateAsset(tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">, tenantId: string, assetId: string, data: any) {
        // Can only update metadata, name, or status (URL changes require a new asset due to checksum)
        const { name, metadata, status } = data;
        
        await this.getAssetById(tx, tenantId, assetId);

        return tx.asset.update({
            where: { id: assetId },
            data: {
                name,
                metadata: metadata !== undefined ? metadata : undefined,
                status
            }
        });
    },

    async deleteAsset(tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">, tenantId: string, assetId: string) {
        await this.getAssetById(tx, tenantId, assetId);
        
        return tx.asset.update({
            where: { id: assetId },
            data: {
                deletedAt: new Date(),
                status: "INACTIVE"
            }
        });
    }
};
