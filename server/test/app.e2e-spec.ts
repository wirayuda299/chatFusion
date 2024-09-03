import * as request from 'supertest';

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should return 400 for invalid data', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/user/create')
      .send({
        email: 'invalid@email',
      });
    console.log(res.error);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('messages');
  });
});
