import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';

/**
 * HTTP Request/Response Logging Interceptor
 * Logs all incoming requests and outgoing responses with timing
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const startTime = Date.now();

    // Log incoming request
    this.logger.request(method, url);

    // Log request body for POST/PUT/PATCH (but not sensitive data)
    if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
      const bodyKeys = Object.keys(body);
      if (bodyKeys.length > 0) {
        this.logger.verbose(
          `Request body keys: ${bodyKeys.join(', ')}`,
          'HTTP',
        );
      }
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          const duration = Date.now() - startTime;

          this.logger.response(method, url, statusCode, duration);

          // Log success message for specific operations
          if (data?.message) {
            this.logger.success(data.message, context.getClass().name);
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.logger.response(method, url, statusCode, duration);
        },
      }),
    );
  }
}
