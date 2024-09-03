import { NestFactory } from '@nestjs/core';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { ValidationFilter } from './common/errorhandler/error-handler';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: process.env.ORIGIN || '*',
      methods: 'GET, POST, PATCH, PUT, DELETE',
      allowedHeaders: ['content-type', 'Cookie'],
      credentials: true,
    },
  });


  app.use(cookieParser());
  app.use(compression());
  app.useGlobalFilters(new ValidationFilter());

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
