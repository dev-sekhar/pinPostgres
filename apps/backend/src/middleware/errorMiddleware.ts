import { Request, Response, NextFunction } from 'express';
import { Prisma } from '../generated/prisma/client.js';
import { AppError } from '../utils/AppError.js';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    console.error(`[Error Handler] ${req.method} ${req.url}:`, err);

    let statusCode = 500;
    let message = 'Internal Server Error';
    let code = 'ERROR_INTERNAL_SERVER';

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        code = err.code;
    } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // e.g. P2002 Unique constraint failed
        if (err.code === 'P2002') {
            statusCode = 409;
            message = 'A record with this value already exists.';
            code = 'ERROR_UNIQUE_CONSTRAINT';
        } else if (err.code === 'P2025') {
            statusCode = 404;
            message = 'Record not found.';
            code = 'ERROR_NOT_FOUND';
        } else {
            statusCode = 400;
            message = `Database Error: ${err.message}`;
            code = 'ERROR_DATABASE';
        }
    } else if (err instanceof Prisma.PrismaClientValidationError) {
        statusCode = 400;
        message = 'Invalid data format provided.';
        code = 'ERROR_VALIDATION';
    } else if (err.message && err.message.includes('not found')) {
        statusCode = 404;
        message = err.message;
        code = 'ERROR_NOT_FOUND';
    } else if (err.name === 'UnauthorizedError' || err.message === 'Unauthorized') {
        statusCode = 401;
        message = 'Unauthorized request.';
        code = 'ERROR_UNAUTHORIZED';
    } else if (err.status) {
        // For custom errors that already have a status code (like express-jwt)
        statusCode = err.status;
        message = err.message;
        code = err.code || 'ERROR_API';
    }

    res.status(statusCode).json({
        error: message,
        code,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
}
