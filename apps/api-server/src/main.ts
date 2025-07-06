import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as https from 'https';

async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule);

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

  const port = Number(process.env.PORT) || (isProd ? 49236 : 3001);

  if (isProd) {
    const httpsOptions = {
      key: fs.readFileSync(
        '/etc/letsencrypt/live/gameshub.duckdns.org/privkey.pem',
      ),
      cert: fs.readFileSync(
        '/etc/letsencrypt/live/gameshub.duckdns.org/fullchain.pem',
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
