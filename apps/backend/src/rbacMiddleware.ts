import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware.js";
import { permissionService } from "./services/permissionService.js";

/**
 * Express middleware to enforce RBAC permissions.
 * Must be used AFTER `requireAuth` so `req.user` is populated.
 */
export const requirePermission = (permissionCode: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user || !req.user.userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const hasPerm = await permissionService.hasPermission(req.user.userId, permissionCode);

            if (!hasPerm) {
                return res.status(403).json({ error: `Forbidden: Requires ${permissionCode} permission` });
            }

            next();
        } catch (error) {
            console.error(`Error checking permission ${permissionCode}:`, error);
            res.status(500).json({ error: "Internal server error during authorization" });
        }
    };
};
