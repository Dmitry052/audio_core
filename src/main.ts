// Must be first — loads .env before any other module reads process.env
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Buffer raw body so the audio proxy controller can forward binary data
    rawBody: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true }),
  );

  app.useWebSocketAdapter(new WsAdapter(app));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`HTTP  → http://localhost:${port}`);
  console.log(`WS    → ws://localhost:${process.env.WS_PORT ?? 3001}/ws/proxy`);
}
bootstrap();
