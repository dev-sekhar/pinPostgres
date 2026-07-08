import { prisma } from "../prismaClient.js";
import { auditService } from "./auditService.js";

export const channelService = {
    async getChannels(tenantId: string) {
        return prisma.channel.findMany({
            where: { tenantId, deletedAt: null },
            orderBy: { name: 'asc' }
        });
    },

    async getChannelById(tenantId: string, id: string) {
        return prisma.channel.findUnique({
            where: { id, tenantId, deletedAt: null }
        });
    },

    async createChannel(tenantId: string, userId: string, data: { code: string, name: string, description?: string, status?: string }, auditMeta?: any) {
        return prisma.$transaction(async (tx) => {
            const channel = await tx.channel.create({
                data: {
                    ...data,
                    tenantId
                }
            });

            await auditService.logEvent(tx as any, {
                tenantId,
                userId,
                entityType: 'Channel',
                entityId: channel.id,
                operation: 'CREATE',
                afterState: channel,
                auditMeta
            });

            return channel;
        });
    },

    async updateChannel(tenantId: string, userId: string, id: string, data: { code?: string, name?: string, description?: string, status?: string }, auditMeta?: any) {
        return prisma.$transaction(async (tx) => {
            const existing = await tx.channel.findUnique({ where: { id, tenantId } });
            if (!existing) throw new Error("Channel not found");

            const channel = await tx.channel.update({
                where: { id },
                data
            });

            await auditService.logEvent(tx as any, {
                tenantId,
                userId,
                entityType: 'Channel',
                entityId: channel.id,
                operation: 'UPDATE',
                beforeState: existing,
                afterState: channel,
                auditMeta
            });

            return channel;
        });
    },

    async deleteChannel(tenantId: string, userId: string, id: string, auditMeta?: any) {
        return prisma.$transaction(async (tx) => {
            const existing = await tx.channel.findUnique({ where: { id, tenantId } });
            if (!existing) throw new Error("Channel not found");

            const channel = await tx.channel.update({
                where: { id },
                data: { deletedAt: new Date() }
            });

            await auditService.logEvent(tx as any, {
                tenantId,
                userId,
                entityType: 'Channel',
                entityId: channel.id,
                operation: 'DELETE',
                beforeState: existing,
                afterState: channel,
                auditMeta
            });

            return channel;
        });
    }
};
