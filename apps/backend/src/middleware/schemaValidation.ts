import { Request, Response, NextFunction } from 'express';
import { validationService } from '../services/validationService.js';
import { AppError } from '../utils/AppError.js';

export const validateSchema = (schemaName: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const errors = validationService.validateFormat(schemaName, req.body);
        if (errors) {
            const message = `Validation Error (${schemaName}): ${errors.map((e: any) => e.message).join(', ')}`;
            return next(new AppError(message, 400));
        }
        next();
    };
};
