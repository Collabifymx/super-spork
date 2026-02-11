import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Collabify E2E', () => {
  let app: INestApplication;
  let brandToken: string;
  let creatorToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    it('POST /api/auth/register - should register brand', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'e2e-brand@test.com', password: 'Password123', firstName: 'E2E', lastName: 'Brand', role: 'BRAND' })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      brandToken = res.body.accessToken;
    });

    it('POST /api/auth/register - should register creator', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'e2e-creator@test.com', password: 'Password123', firstName: 'E2E', lastName: 'Creator', role: 'CREATOR' })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      creatorToken = res.body.accessToken;
    });

    it('POST /api/auth/login - should login', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'e2e-brand@test.com', password: 'Password123' })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
    });
  });

  describe('Health', () => {
    it('GET /api/health - should return healthy', async () => {
      const res = await request(app.getHttpServer()).get('/api/health').expect(200);
      expect(res.body.status).toBe('healthy');
    });
  });

  describe('Search', () => {
    it('GET /api/search/creators - should return creators', async () => {
      const res = await request(app.getHttpServer()).get('/api/search/creators').expect(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
    });
  });
});
