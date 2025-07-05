import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());

  const allowedOrigins =
    process.env.NODE_ENV === 'production'
      ? ['https://games-hub-web.vercel.app']
      : ['http://localhost:3000', 'http://localhost:5173'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  if (process.env.VERCEL) {
    app.setGlobalPrefix('api');
  }

  await app.listen(process.env.PORT ?? 3001);
  console.log('Сервер запущен на порту', process.env.PORT ?? 3001);
}

if (process.env.VERCEL) {
  bootstrap();
}

if (!process.env.VERCEL) {
  bootstrap();
}

export default bootstrap;
