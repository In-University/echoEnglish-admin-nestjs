import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Loại field thừa không có trong DTO
      forbidNonWhitelisted: true, //Báo lỗi nếu có field thừa
      transform: true, // Tự động chuyển đổi (transform) payload thành instance của class DTO
    }),
  );

  app.enableCors({
    origin: [
      'http://localhost:3000', // Next.js chạy ở port 3000
      'http://127.0.0.1:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const port = process.env.PORT || 8999;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
