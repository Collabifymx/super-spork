import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const user = request.user;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            this.prisma.auditLog.create({
              data: {
                userId: user?.sub || user?.id,
                action: `${method} ${url}`,
                ipAddress: request.ip,
                userAgent: request.headers['user-agent'],
                metadata: { duration, statusCode: 200 },
              },
            }).catch((err) => this.logger.error('Audit log failed', err));
          }
        },
        error: (err) => {
          const duration = Date.now() - start;
          this.logger.warn(`${method} ${url} failed after ${duration}ms: ${err.message}`);
        },
      }),
    );
  }
}
