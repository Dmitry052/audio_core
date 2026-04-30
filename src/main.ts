// Must be first — loads .env before any other module reads process.env
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';
import { runWithCluster } from './cluster';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useWebSocketAdapter(new WsAdapter(app));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

runWithCluster(bootstrap);
