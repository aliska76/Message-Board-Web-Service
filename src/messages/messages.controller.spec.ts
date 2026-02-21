import { Test, TestingModule } from '@nestjs/testing';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './messages.entity';
import { Vote } from './vote.entity';
import { User } from '../users/user.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { DataSource } from 'typeorm';

describe('MessagesController (integration)', () => {
  let controller: MessagesController;
  let module: TestingModule;
  let dataSource: DataSource;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Message, Vote, User],
          synchronize: true,
          logging: false // Remove logging for tests
        }),
        TypeOrmModule.forFeature([Message, Vote, User]), // Add repositories
      ],
      controllers: [MessagesController],
      providers: [MessagesService],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<MessagesController>(MessagesController);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    // Clear and close connection
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await module.close();
  }, 1000);

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a message', async () => {
    // Create test user
    const userRepo = dataSource.getRepository(User);
    const user = await userRepo.save({
      username: 'testuser',
      passwordHash: 'hashedpassword',
    });

    // Mock req.user
    const req = { user: { id: user.id, username: user.username } };

    const createMessageDto = { content: 'Test message' };

    // Call controller
    const result = await controller.create(req as any, createMessageDto);

    expect(result).toBeDefined();
    expect(result.content).toBe('Test message');
    expect(result.authorId).toBe(user.id);
  }, 1000);
});