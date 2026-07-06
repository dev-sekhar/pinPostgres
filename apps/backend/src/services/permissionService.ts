import { prisma } from '../prismaClient.js';

export class PermissionService {
    /**
     * Resolves all unique permission codes for a given user.
     */
    async getUserPermissions(userId: string): Promise<string[]> {
        const userRoles = await prisma.userRole.findMany({
            where: { userId },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                }
            }
        });

        const permissionSet = new Set<string>();

        for (const ur of userRoles) {
            // If the role is inactive, we skip its permissions
            if (!ur.role.isActive) continue;

            for (const rp of ur.role.rolePermissions) {
                permissionSet.add(rp.permission.code);
            }
        }

        return Array.from(permissionSet);
    }

    /**
     * Checks if a user has a specific permission.
     */
    async hasPermission(userId: string, requiredPermission: string): Promise<boolean> {
        const permissions = await this.getUserPermissions(userId);
        return permissions.includes(requiredPermission);
    }
}

export const permissionService = new PermissionService();
