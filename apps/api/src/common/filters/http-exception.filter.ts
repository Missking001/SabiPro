import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Something went wrong. Please try again later';
    let field: string | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resBody: any = exception.getResponse();

      if (typeof resBody === 'string') {
        message = resBody;
      } else if (resBody && typeof resBody === 'object') {
        // ValidationPipe returns validation messages as an array
        if (Array.isArray(resBody.message)) {
          code = 'VALIDATION_ERROR';
          message = resBody.message[0]; // Take the first error message
          // Try to guess the field from the validation message
          // e.g. "email must be a valid email" -> "email"
          const words = message.split(' ');
          if (words.length > 0) {
            field = words[0].replace(/['"]/g, ''); // strip quotes
          }
        } else {
          message = resBody.message || exception.message;
        }
      }

      // Assign semantic error codes based on status
      if (status === HttpStatus.BAD_REQUEST && code !== 'VALIDATION_ERROR') {
        code = 'BAD_REQUEST';
      } else if (status === HttpStatus.UNAUTHORIZED) {
        code = 'UNAUTHORIZED';
      } else if (status === HttpStatus.FORBIDDEN) {
        code = 'FORBIDDEN';
      } else if (status === HttpStatus.NOT_FOUND) {
        code = 'NOT_FOUND';
      } else if (status === HttpStatus.CONFLICT) {
        code = 'CONFLICT';
      } else if (status === HttpStatus.UNPROCESSABLE_ENTITY) {
        code = 'UNPROCESSABLE_ENTITY';
      }
    } else {
      // Log unhandled non-HTTP exceptions internally
      this.logger.error(
        `Unhandled exception on ${request?.method} ${request?.url}: ${exception?.message || exception}`,
        exception?.stack
      );
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        ...(field ? { field } : {}),
      },
    });
  }
}
