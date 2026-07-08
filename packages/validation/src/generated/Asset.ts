import { z } from 'zod';

export const AssetSchema = z.object({ "name": z.string().min(1).max(255).describe("Name or title of the asset"), "url": z.string().url().describe("Public URL to fetch the digital asset from") }).strict().describe("JSON Schema for a digital Asset URL upload");
export type Asset = z.infer<typeof AssetSchema>;
