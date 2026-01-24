/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Response } from "express";
import { map, Observable } from "rxjs";

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T, any>{
    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<any>{
        const res = context.switchToHttp().getResponse<Response>();
        const handler = context.getHandler();
        const message = Reflect.getMetadata('response_message', handler) ?? 'Thành công';
        return next.handle().pipe(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            map((data: any) => ({
                success: true,
                statusCode: res.statusCode,
                message,
                data,
            })),
        )
    }
}