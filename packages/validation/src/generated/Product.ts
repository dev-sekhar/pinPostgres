import { z } from 'zod';

export const ProductSchema = z.object({ "name": z.string().min(2).max(255), "description": z.string().optional(), "price": z.number().gte(0), "productFamilyId": z.string().uuid(), "brandId": z.string().uuid().nullable().optional(), "supplierId": z.string().uuid().nullable().optional(), "manufacturerId": z.string().uuid().nullable().optional(), "parentId": z.string().uuid().nullable().optional(), "attributes": z.record(z.string(), z.any()).optional(), "complianceTypeIds": z.array(z.string().uuid()).optional(), "channelIds": z.array(z.string().uuid()).optional(), "status": z.enum(["ACTIVE","INACTIVE","DRAFT","ARCHIVED"]).optional() }).strict();
export type Product = z.infer<typeof ProductSchema>;
