import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest'; 
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/user.entity';
import { Message } from '../src/messages/messages.entity';
import { Vote } from '../src/messages/vote.entity';
import { ThrottlerBehindProxyGuard } from '../src/common/guards/throttler-behind-proxy.guard';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';


describe('AppController (e2e)', () => {
  let app: INestApplication;
  let userRepository: any;
  let messageRepository: any;
  let voteRepository: any;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
    .overrideGuard(ThrottlerBehindProxyGuard)
    .useValue({ canActivate: () => true })
    .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) => {
          if (key === 'JWT_SECRET') return 'test-secret-key';
          if (key === 'NODE_ENV') return 'test';
          return null;
        }
      })
    .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: false
      })
    );

    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();

    userRepository = app.get(getRepositoryToken(User));
    messageRepository = app.get(getRepositoryToken(Message));
    voteRepository = app.get(getRepositoryToken(Vote));
    jwtService = app.get(JwtService);
  });

  beforeEach(async () => {
    await voteRepository.clear();
    await messageRepository.clear();
    await userRepository.clear();
  });

  describe('Health Check', () => {
    it('/ (GET) - should return 404', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(404);
    });
  });

  describe('Auth Endpoints', () => {
    let testUser: { username: string; password: string };
    
    describe('POST /auth/register', () => {
      beforeEach(async () => {
        testUser = {
          username: `testuser1`,
          password: 'Test123456',
        };
      });

      it('should register a new user', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser)
          .expect(201);
        
        expect(response.body).toHaveProperty('access_token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.username).toBe(testUser.username);

        // Check token
        const decoded = jwtService.verify(response.body.access_token);
        expect(decoded).toHaveProperty('sub');
        expect(decoded).toHaveProperty('username', testUser.username);
      });

      it('should not register with existing username', async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser)
          .expect(201);

        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser)
          .expect(409);

        expect(response.body.message.toString()).toContain('Username already exists');
      });

      it('should validate username - too short', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send({ username: 'ab', password: 'Test123456' })
          .expect(400);

        expect(response.body.message).toBeDefined();
        expect(Array.isArray(response.body.message)).toBe(true);
      });

      it('should validate password - too weak', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send({ username: 'newuser', password: 'weak' })
          .expect(400);

        expect(response.body.message).toBeDefined();
        expect(Array.isArray(response.body.message)).toBe(true);
      });
    });

    describe('POST /auth/login', () => {
      let testUser: { username: string; password: string };
      
      beforeEach(async () => {
        const currentDate = new Date();
        testUser = {
          username: `loginuser_${currentDate.getMilliseconds().toString()}`,
          password: 'Test123456',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser)
          .expect(201);
      });

      it('should login with correct credentials', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send(testUser)
          .expect(200);

        expect(response.body).toHaveProperty('access_token');
        expect(response.body.user.username).toBe(testUser.username);
      });

      it('should not login with wrong password', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ username: testUser.username, password: 'wrong' })
          .expect(401);

        expect(response.body.message).toBeDefined();
      });

      it('should not login with non-existent user', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ username: 'nonexistent', password: 'Test123456' })
          .expect(401);

        expect(response.body.message).toBeDefined();
      });
    });

    describe('POST /auth/logout', () => {
      let testUser: { username: string; password: string };
      let authToken: string;

      beforeEach(async () => {
        const currentDate = new Date();
        testUser = {
          username: `logoutuser_${currentDate.getMilliseconds().toString() }`,
          password: 'Test123456',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser)
          .expect(201);

        const loginResponse = await request(app.getHttpServer())
          .post('/auth/login')
          .send(testUser)
          .expect(200);

        authToken = loginResponse.body.access_token;
      });

      it('should logout with valid token', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/logout')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.message).toBe('Logged out successfully');
      });

      it('should not logout without token', async () => {
        await request(app.getHttpServer())
          .post('/auth/logout')
          .expect(401);
      });

      it('should not logout with invalid token', async () => {
        await request(app.getHttpServer())
          .post('/auth/logout')
          .set('Authorization', 'Bearer invalid.token.here')
          .expect(401);
      });
    });
  });

  describe('Messages Endpoints', () => {
    let authToken: string;
    let userId: string;
    let messageId: string;
    let testUser: { username: string; password: string };

    beforeEach(async () => {
      const currentDate = new Date();
      testUser = {
        username: `messageuser_${currentDate.getMilliseconds().toString()}`,
        password: 'Test123456',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);
      
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUser)
        .expect(200);


      authToken = loginRes.body.access_token;
      userId = loginRes.body.user.id;
    });

    describe('GET /user/messages', () => {
      beforeEach(async () => {
        // Create several messages
        await request(app.getHttpServer())
          .post('/messages')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ content: 'User message 1' });

          await request(app.getHttpServer())
          .post('/messages')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ content: 'User message 2' });
      });

      it('should get all messages of current user', async () => {
        const response = await request(app.getHttpServer())
          .get('/messages/user/messages')
          .set('Authorization', `Bearer ${authToken}`)
          .set('Content-Type', 'application/json');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);
        response.body.forEach((msg: any) => {
          expect(msg.authorId).toBe(userId);
        });
      });

      it('should not get user messages without auth', async () => {
        await request(app.getHttpServer())
          .get('/messages/user/messages')
          .expect(401);
      });
    });

    describe('GET /messages', () => {
      beforeEach(async () => {
        // Create test message
        const res = await request(app.getHttpServer())
          .post('/messages')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ content: 'Test message for GET' });
        messageId = res.body.id;
      });

      it('should get all messages', () => {
        return request(app.getHttpServer())
          .get('/messages')
          .expect(200)
          .expect(res => {
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body[0]).toHaveProperty('content');
            expect(res.body[0]).toHaveProperty('authorId');
            expect(res.body[0]).toHaveProperty('voteCount');
          });
      });

      it('should return messages with user vote info when authenticated', () => {
        return request(app.getHttpServer())
          .get('/messages')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect(res => {
            expect(Array.isArray(res.body)).toBe(true);
            const message = res.body.find(m => m.id === messageId);
            expect(message).toBeDefined();
            expect(message).toHaveProperty('userVote');
          });
      });
    });

    describe('POST /messages', () => {
      it('should create a message', async () => {
        const response = await request(app.getHttpServer())
          .post('/messages')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ content: 'Test message content' })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('content', 'Test message content');
        expect(response.body).toHaveProperty('authorId', userId);
        expect(response.body).toHaveProperty('voteCount', 0);

        // Check id - valid UUID
        expect(response.body.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

        messageId = response.body.id;
      });

      it('should not create message without auth', () => {
        return request(app.getHttpServer())
          .post('/messages')
          .send({ content: 'Test message' })
          .expect(401);
      });

      it('should validate message content - empty', () => {
        return request(app.getHttpServer())
          .post('/messages')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ content: '' })
          .expect(400);
      });
    });

    describe('POST /messages/:id/vote', () => {
      let messageId: string;

      beforeEach(async () => {
        const response = await request(app.getHttpServer())
          .post('/messages')
          .set('Authorization', `Bearer ${authToken}`)
          .set('Content-Type', 'application/json')
          .send({ content: 'Message to vote on' })
          .expect(201);

        messageId = response.body.id;
      });

      it('should upvote a message', async () => {     
        const response = await request(app.getHttpServer())
          .post(`/messages/${messageId}/vote`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('Content-Type', 'application/json')
          .send({ value: 1 });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('messageId', messageId);
        expect(response.body).toHaveProperty('voteCount', 1);
        expect(response.body).toHaveProperty('yourVote', 1);
      });

      it('should downvote a message', () => {
        return request(app.getHttpServer())
          .post(`/messages/${messageId}/vote`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('Content-Type', 'application/json')
          .send({ value: -1 })
          .expect(200)
          .expect(res => {
            expect(res.body.messageId).toBe(messageId);
            expect(res.body.voteCount).toBe(-1);
            expect(res.body.yourVote).toBe(-1);
          });
      });

      it('should change vote from up to down', async () => {
        // Vote +
        await request(app.getHttpServer())
          .post(`/messages/${messageId}/vote`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ value: 1 });

        // Change vote to -
        return request(app.getHttpServer())
          .post(`/messages/${messageId}/vote`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ value: -1 })
          .expect(200)
          .expect(res => {
            expect(res.body.voteCount).toBe(-1);
            expect(res.body.yourVote).toBe(-1);
          });
      });

      it('should not vote on non-existent message', () => {
        return request(app.getHttpServer())
          .post('/messages/00000000-0000-0000-0000-000000000000/vote')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ value: 1 })
          .expect(404);
      });

      it('should validate vote value', () => {
        return request(app.getHttpServer())
          .post(`/messages/${messageId}/vote`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ value: 5 })
          .expect(400);
      });
    });

    describe('DELETE /messages/:id', () => {
      beforeEach(async () => {
        // Create test message
        const res = await request(app.getHttpServer())
          .post('/messages')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ content: 'Message to delete' });
        messageId = res.body.id;
      });

      it('should delete own message', () => {
        return request(app.getHttpServer())
          .delete(`/messages/${messageId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(204);
      });

      it('should not delete message of another user', async () => {
        // Create other user
        const otherUser = {
          username: 'otheruser',
          password: 'Test123456',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(otherUser);

        const otherLogin = await request(app.getHttpServer())
          .post('/auth/login')
          .send(otherUser);

        const otherToken = otherLogin.body.access_token;

        // Try to delete other user message 
        return request(app.getHttpServer())
          .delete(`/messages/${messageId}`)
          .set('Authorization', `Bearer ${otherToken}`)
          .expect(403);
      });

      it('should not delete non-existent message', () => {
        return request(app.getHttpServer())
          .delete('/messages/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });
  });
  
  afterAll(async () => {
    await app.close();
  });
});
