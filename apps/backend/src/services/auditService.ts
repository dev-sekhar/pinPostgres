
import { AuditOperation, AuditSource } from "../generated/prisma/client.js";
export interface AuditLogInput {
    tenantId: string;
    userId?: string;
    entityType: string;
    entityId: string;
    operation: AuditOperation;
    beforeState?: any;
    afterState?: any;
    remarks?: string;
    // Metadata passed from the request
    auditMeta?: {
        requestId?: string;
        ipAddress?: string;
        userAgent?: string;
        source?: AuditSource;
    };
}

export const auditService = {
    /**
     * Computes a shallow diff between before and after states.
     * Only returns keys that changed.
     */
    computeChangedFields: (before: any, after: any) => {
        if (!before || !after) return null;
        
        const changes: Record<string, any> = {};
        const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
        
        for (const key of allKeys) {
            // Very simple JSON stringify comparison for deep objects/arrays.
            // For production, a deep-diff library is recommended.
            const beforeVal = JSON.stringify(before[key]);
            const afterVal = JSON.stringify(after[key]);
            if (beforeVal !== afterVal) {
                changes[key] = { from: before[key], to: after[key] };
            }
        }
        
        return Object.keys(changes).length > 0 ? changes : null;
    },

    /**
     * Logs an audit event using Prisma.
     * Uses withTenant approach internally to respect RLS if needed,
     * though typically system-level inserts can bypass RLS depending on setup.
     */
    logEvent: async (tx: any, input: AuditLogInput) => {
        try {
            const changedFields = auditService.computeChangedFields(input.beforeState, input.afterState);

            await tx.auditLog.create({
                data: {
                    tenantId: input.tenantId,
                    userId: input.userId,
                    entityType: input.entityType,
                    entityId: input.entityId,
                    operation: input.operation,
                    beforeState: input.beforeState || undefined,
                    afterState: input.afterState || undefined,
                    changedFields: changedFields || undefined,
                    remarks: input.remarks,
                    source: input.auditMeta?.source || 'SYSTEM',
                    requestId: input.auditMeta?.requestId,
                    ipAddress: input.auditMeta?.ipAddress,
                    userAgent: input.auditMeta?.userAgent,
                }
            });
        } catch (error) {
            console.error("Failed to write audit log:", error);
            // We intentionally do not throw the error here so that business logic 
            // is not disrupted by a failed audit log, though this is a business decision.
        }
    }
};
