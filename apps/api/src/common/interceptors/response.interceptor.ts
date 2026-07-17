import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    // Skip wrapping if request is for health check or specific endpoints if needed,
    // but health checks can also be enveloped or keep it simple.
    const http = context.switchToHttp();
    const req = http.getRequest();
    if (req.url === '/health' || req.url === '/api/health') {
      return next.handle();
    }

    return next.handle().pipe(
      map((res) => {
        // If the controller response already follows the envelope pattern, pass it through
        if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
          return res;
        }

        // If res has a clear paginated pattern with meta, let's keep it but ensure envelope shape
        if (res && typeof res === 'object' && 'data' in res && 'meta' in res) {
          return {
            success: true,
            data: res.data,
            meta: res.meta,
          };
        }

        // Default wrapper
        return {
          success: true,
          data: res === undefined ? null : res,
        };
      }),
    );
  }
}
