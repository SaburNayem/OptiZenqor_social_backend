import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException
      ? exception.getResponse()
      : 'Internal server error';

    let message = 'Request failed';
    let error = 'Request failed';

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
      error = exceptionResponse;
    } else if (
      exceptionResponse &&
      typeof exceptionResponse === 'object'
    ) {
      const responseObject = exceptionResponse as {
        message?: string | string[];
        error?: string;
      };

      if (Array.isArray(responseObject.message)) {
        message = responseObject.message[0] ?? 'Validation failed';
        error = responseObject.error ?? 'Validation failed';
      } else if (typeof responseObject.message === 'string') {
        message = responseObject.message;
        error = responseObject.error ?? responseObject.message;
      }
    }

    response.status(status).json({
      success: false,
      message,
      error,
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
