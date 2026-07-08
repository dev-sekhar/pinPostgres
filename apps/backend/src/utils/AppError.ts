export class AppError extends Error {
    public statusCode: number;
    public code: string;
    public isOperational: boolean;

    constructor(message: string, statusCode: number, code: string = 'ERROR_API') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        // Ensure the prototype chain is properly set for instanceof checks
        Object.setPrototypeOf(this, new.target.prototype);

        Error.captureStackTrace(this, this.constructor);
    }
}
