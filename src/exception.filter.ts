import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';

export class OllamaError extends Error {
  constructor(
    public ollamaCode?: string,
    message: string = 'Ollama error',
  ) {
    super(message);
    this.name = 'OllamaError';
  }
}

@Catch() // Catches ALL exceptions
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorMessage = 'Internal Server Error';
    let errorCode: string | number | undefined;

    let errorDetails: any; // For more structured information

    // 1. Handle Known Exception Types
    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      errorMessage = exception.message;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Prisma Errors
      errorMessage = `Prisma Error: ${exception.message}`;
      errorCode = exception.code;
      errorDetails = exception.meta;

      if (exception.code === 'P2002') {
        httpStatus = HttpStatus.CONFLICT;
        errorMessage = 'Unique constraint violation';
      } else if (exception.code === 'P2025') {
        httpStatus = HttpStatus.NOT_FOUND;
        errorMessage = 'Record not found';
      }
    } else if (exception instanceof OllamaError) {
      // Ollama Errors
      errorMessage = `Ollama Error: ${exception.message}`;
      errorCode = exception.ollamaCode;
      httpStatus = HttpStatus.BAD_GATEWAY;
      errorDetails = { ollamaCode: exception.ollamaCode };
    } else if (exception instanceof Error) {
      // Generic JavaScript Error
      errorMessage = exception.message;
      errorDetails = { stack: exception.stack };
    } else {
      // Unknown Error - Provide a generic message
      errorMessage = 'An unexpected error occurred.';
      errorDetails = { error: exception };
    }

    // 2. Construct the Error Response
    const responseBody = {
      statusCode: httpStatus || '',

      timestamp: new Date().toISOString() || '',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      path: httpAdapter?.getRequestUrl(ctx?.getRequest()) || '',

      message: errorMessage || '',

      errorCode: errorCode || '',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      details: errorDetails || '',
    };

    this.logger.error(
      // eslint-disable-next-line  @typescript-eslint/no-unsafe-member-access
      `${httpStatus} - ${errorMessage} - ${ctx?.getRequest()?.url}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    );

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
