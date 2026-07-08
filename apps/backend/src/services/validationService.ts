import _Ajv from 'ajv';
import _addFormats from 'ajv-formats';
import fs from 'fs';
import path from 'path';
import { prisma } from '../prismaClient.js';

const Ajv = (_Ajv as any).default || _Ajv;
const addFormats = (_addFormats as any).default || _addFormats;

class ValidationService {
    private ajv: any;
    private schemas: Map<string, any>;

    constructor() {
        this.ajv = new Ajv({ allErrors: true });
        addFormats(this.ajv);
        this.schemas = new Map();
        
        // Load schemas from packages/validation/schemas/json
        const schemasDir = path.resolve(process.cwd(), '../../packages/validation/schemas/json');
        if (fs.existsSync(schemasDir)) {
            const files = fs.readdirSync(schemasDir).filter(f => f.endsWith('.json'));
            for (const file of files) {
                const schemaName = path.basename(file, '.json');
                const schema = JSON.parse(fs.readFileSync(path.join(schemasDir, file), 'utf8'));
                this.ajv.addSchema(schema, schemaName);
                this.schemas.set(schemaName, schema);
            }
        } else {
            console.warn("Schema directory not found:", schemasDir);
        }
    }

    /**
     * Validate data format against JSON Schema
     */
    public validateFormat(schemaName: string, data: any) {
        const validate = this.ajv.getSchema(schemaName);
        if (!validate) {
            throw new Error(`Schema not found: ${schemaName}`);
        }
        
        const valid = validate(data);
        if (!valid) {
            return validate.errors;
        }
        return null; // Valid
    }

    /**
     * Async business rules validation (e.g. uniqueness checks)
     */
    public async validateBusinessRules(entityType: string, tenantId: string, data: any, existingId?: string) {
        const errors: string[] = [];

        // Example: Check uniqueness of code for Master Data
        if (['Brand', 'Supplier', 'Manufacturer', 'Channel', 'ComplianceType'].includes(entityType)) {
            if (data.code) {
                const existing = await (prisma as any)[entityType.toLowerCase()].findFirst({
                    where: { code: data.code, tenantId, deletedAt: null }
                });
                if (existing && existing.id !== existingId) {
                    errors.push(`${entityType} code must be unique within the tenant.`);
                }
            }
        }

        // Example: Product SKU rules
        if (entityType === 'Product') {
            if (data.sku) {
                const existing = await prisma.product.findFirst({
                    where: { sku: data.sku, tenantId, deletedAt: null }
                });
                if (existing && existing.id !== existingId) {
                    errors.push(`Product SKU must be unique.`);
                }
            }
        }

        return errors.length ? errors : null;
    }

    /**
     * For batch operations like CSV uploads - allows partial acceptance
     */
    public async validateBatch(entityType: string, tenantId: string, items: any[]) {
        const results = {
            valid: [] as any[],
            invalid: [] as { item: any, errors: any }[]
        };

        for (const item of items) {
            const formatErrors = this.validateFormat(entityType, item);
            if (formatErrors) {
                results.invalid.push({ item, errors: formatErrors });
                continue;
            }

            const businessErrors = await this.validateBusinessRules(entityType, tenantId, item);
            if (businessErrors) {
                results.invalid.push({ item, errors: businessErrors });
                continue;
            }

            results.valid.push(item);
        }

        return results;
    }
}

export const validationService = new ValidationService();
