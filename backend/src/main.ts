import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Activar validación global de DTOs ──
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina campos basura que no estén en el DTO
      forbidNonWhitelisted: true, // Lanza error si envían campos no permitidos
      transform: true, // Transforma los payloads a las instancias de los DTOs
    }),
  );

  // ── Habilitar CORS para conectar con React (Vite/CRA) ──
  app.enableCors({
    origin: process.env.CORS_ORIGINS || 'http://localhost:5173',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
