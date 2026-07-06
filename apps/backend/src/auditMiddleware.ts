import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Generate a unique request ID for correlation if one isn't already present
    req.headers['x-request-id'] = req.headers['x-request-id'] || crypto.randomUUID();
    
    // Attach metadata to a custom audit property on the request
    (req as any).auditMeta = {
        requestId: req.headers['x-request-id'],
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        source: 'API'
    };

    next();
};
