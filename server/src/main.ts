import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './exceptions/exceptions.filter';
import { TransformResponseInterceptor } from './interceptors/transform-response.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
// import cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformResponseInterceptor())

  // Cấu hình phục vụ static files từ thư mục uploads
  app.useStaticAssets(path.join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  const configuredOrigins = (process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const allowedOrigins = new Set<string>([
    'http://localhost:3000',
    'http://localhost:3001',
    'https://extracurricular-management.vercel.app',
    ...configuredOrigins,
  ]);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests without origin (Postman/server-to-server)
      // Allow any origin that matches our allowlist or if no origin header
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      // Check for ngrok domains (temporary dev tunnels)
      if (origin && /https:\/\/.+\.ngrok[\w-]*\.dev$/i.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'ngrok-skip-browser-warning',
      'X-Requested-With',
      'Accept',
    ],
    maxAge: 86400,
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Server listening on http://localhost:${port}`);
}
bootstrap();
