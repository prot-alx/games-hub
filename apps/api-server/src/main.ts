import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as https from 'https';

async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'debug', 'error', 'verbose', 'warn'],
  });

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());

  const allowedOrigins = isProd
    ? ['https://games-hub-web.vercel.app']
    : ['http://localhost:5173'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  if (isProd) {
    app.setGlobalPrefix('api');
  }
  await app.init();

  console.log('=== ПРОВЕРКА РОУТОВ ===');
  const httpAdapter = app.getHttpAdapter();
  const instance = httpAdapter.getInstance();
  console.log('HTTP adapter type:', httpAdapter.constructor.name);
  console.log('Routes registered:', !!instance._router);

  const port = Number(process.env.PORT) || (isProd ? 49236 : 3001);

  if (isProd) {
    const isWindows = process.platform === 'win32';
    const httpsOptions = {
      key: fs.readFileSync(
        isWindows
          ? './certs/key.pem'
          : '/etc/letsencrypt/live/gameshub.duckdns.org/privkey.pem',
      ),
      cert: fs.readFileSync(
        isWindows
          ? './certs/cert.pem'
          : '/etc/letsencrypt/live/gameshub.duckdns.org/fullchain.pem',
      ),
    };
    const server = https.createServer(
      httpsOptions,
      app.getHttpAdapter().getInstance(),
    );
    server.listen(port, () => {
      console.log(`🚀 HTTPS сервер запущен на порту ${port}`);
    });
  } else {
    await app.listen(port);
    console.log(`🚀 HTTP сервер запущен на порту ${port}`);
  }
}

bootstrap();
