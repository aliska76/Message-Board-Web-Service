import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status: number;
        let message: string | string[];
        let error: string;

        this.logger.error(
            `${request.method} ${request.url}`,
            exception instanceof Error ? exception.stack : 'Unknown error',
        );

        if (exception instanceof HttpException) {
            // Standart HTTP NestJS exceptions
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
                error = exceptionResponse;
            } else {
                message = (exceptionResponse as any).message || 'Http exception';
                error = (exceptionResponse as any).error || 'Http Error';
            }
        } else if (exception instanceof QueryFailedError) {
            // DataBase Exception
            status = HttpStatus.BAD_REQUEST;
            message = 'Database operation failed';
            error = 'Database Error';

            // SQLite Error
            if (exception.message.includes('UNIQUE constraint failed')) {
                status = HttpStatus.CONFLICT;
                message = 'Resource already exists';
                error = 'Conflict';
            }
        } else if (exception instanceof TypeError) {
            // Invalid data type error
            status = HttpStatus.BAD_REQUEST;
            message = 'Invalid data type';
            error = 'Bad Request';
        } else {
            // Unknown error
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Internal server error';
            error = 'Internal Server Error';
        }

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            error,
            message: Array.isArray(message) ? message : [message],
        });
    }
}