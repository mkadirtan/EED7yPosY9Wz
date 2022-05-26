import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FileProvider } from '../file/file.provider';

export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private readonly fileProvider: FileProvider) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => {
        if (data.image) {
          data.image = this.fileProvider.getFileUrl(data.image);
        }
        if (!data.excerpt) {
          data.excerpt = data.content.slice(0, 200);
        }

        return { data };
      })
    );
  }
}
