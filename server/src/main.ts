import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './exceptions/exceptions.filter';
import { TransformResponseInterceptor } from './interceptors/transform-response.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformResponseInterceptor())

  // Cấu hình phục vụ static files từ thư mục uploads
  app.useStaticAssets(path.join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
  }));

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
