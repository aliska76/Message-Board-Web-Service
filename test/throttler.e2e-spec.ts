import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

process.env.NODE_ENV = 'development'; // Throttler Enabled

describe('Throttler (e2e)', () => {
    let app: INestApplication;
    let testUser: { username: string; password: string };
    const REGISTER_LIMIT = 3;

    const createThrottlerApp = async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule]
        }).compile();

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
        return app;
    }

    afterEach(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('Health Check', () => {
        it('/ (GET) - should return 404', async () => {
            const testApp = await createThrottlerApp();
            await request(testApp.getHttpServer())
                .get('/')
                .expect(404);
            await testApp.close();
        });
    });

    beforeEach(() => {
        const currentDate = new Date();
        const randomNum = Math.floor(Math.random() * 10000);
        testUser = {
            username: `ratelimit_${currentDate.getMilliseconds().toString()}_${randomNum}`,
            password: 'Test123456',
        };
    });

    it('should block register attempts after limit is exceeded', async () => {
        const testApp = await createThrottlerApp();
        const currentDate = new Date();
        const baseUsername = `register_${currentDate.getMilliseconds().toString()}`;

        for (let i = 0; i < REGISTER_LIMIT; i++) {
            const registerResponse = await request(testApp.getHttpServer())
                .post('/auth/register')
                .set('Content-Type', 'application/json')
                .send({
                    username: `${baseUsername}_${i}`,
                    password: 'Test123456'
                });

            expect(registerResponse.status).toBe(201);
        }

        const blockedResponse = await request(testApp.getHttpServer())
            .post('/auth/register')
            .set('Content-Type', 'application/json')
            .send({
                username: `${baseUsername}_${REGISTER_LIMIT}`,
                password: 'Test123456'
            });

        expect(blockedResponse.status).toBe(429);
        expect(blockedResponse.body.message.toString()).toContain('Too Many Requests');
    }, 30000);

    it('should verify user exists after registration', async () => {
        const testApp = await createThrottlerApp();

        // Register
        await request(testApp.getHttpServer())
            .post('/auth/register')
            .set('Content-Type', 'application/json')
            .send(testUser)
            .expect(201);

        // Try to login with same credentials
        const loginResponse = await request(testApp.getHttpServer())
            .post('/auth/login')
            .set('Content-Type', 'application/json')
            .send(testUser);

        expect(loginResponse.status).toBe(200);
    });

    it('should block login attempts after limit is exceeded', async () => {
        const testApp = await createThrottlerApp();
        const uniqueUser = testUser = {
            username: `${testUser.username}_K`,
            password: 'Test123456',
        };
        // Create user
        const registerResponse = await request(testApp.getHttpServer())
            .post('/auth/register')
            .send(testUser);

        expect(registerResponse.status).toBe(201);

        for (let i = 0; i < REGISTER_LIMIT; i++) {
            const loginResponse = await request(testApp.getHttpServer())
                .post('/auth/login')
                .send(testUser);

            expect(loginResponse.status).toBe(200);
            expect(loginResponse.body).toHaveProperty('access_token');
            expect(loginResponse.body.user.username).toBe(testUser.username);
        }

        // Next try should blocked
        const blockedResponse = await request(testApp.getHttpServer())
            .post('/auth/login')
            .send(testUser);

        expect(blockedResponse.status).toBe(429);
        expect(blockedResponse.body.message.toString()).toContain('Too Many Requests');
    }, 30000);

    it('should have different limits for register (3) and login (10)', async () => {  
        const throttlerApp = await createThrottlerApp();
        
        for (let i = 0; i < REGISTER_LIMIT; i++) {
            const response = await request(throttlerApp.getHttpServer())
            .post('/auth/register')
            .send({
                username: `${testUser.username}_${i}`,
                password: testUser.password
            });

            expect(response.status).toBe(201);
        }

        const blockedRegister = await request(throttlerApp.getHttpServer())
            .post('/auth/register')
            .send({ username: `${testUser.username}_n`, password: testUser.password });

        expect(blockedRegister.status).toBe(429);
        expect(blockedRegister.body.message.toString()).toBe('ThrottlerException: Too Many Requests');

        const loginResponse = await request(throttlerApp.getHttpServer())
            .post('/auth/login')
            .send(testUser);

        expect(loginResponse.status).not.toBe(429);
    }, 30000);

    it('should reset after TTL expires', async () => {
        const throttlerApp = await createThrottlerApp();
        jest.useFakeTimers();

        await request(throttlerApp.getHttpServer())
            .post('/auth/register')
            .set('Content-Type', 'application/json')
            .send(testUser)
            .expect(201);

        for (let i = 0; i < REGISTER_LIMIT; i++) {
            await request(throttlerApp.getHttpServer())
            .post('/auth/login')
            .send(testUser)
            .expect(200);
        }

        const blockedResponse = await request(throttlerApp.getHttpServer())
            .post('/auth/login')
            .set('Content-Type', 'application/json')
            .send(testUser);

        expect(blockedResponse.status).toBe(429);

        // TTL = 60 sec
        jest.advanceTimersByTime(61000);

        // After TTL request should pass
        const newResponse = await request(throttlerApp.getHttpServer())
            .post('/auth/login')
            .set('Content-Type', 'application/json')
            .send(testUser);

        expect(newResponse.status).toBe(200);

        jest.useRealTimers();
    }, 30000);
});
