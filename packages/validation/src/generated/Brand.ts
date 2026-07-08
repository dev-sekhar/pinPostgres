import { z } from 'zod';

export const BrandSchema = z.object({ "code": z.string().min(2).max(50), "name": z.string().min(2).max(255), "status": z.enum(["ACTIVE","INACTIVE","DRAFT","ARCHIVED"]).optional() }).strict();
export type Brand = z.infer<typeof BrandSchema>;
