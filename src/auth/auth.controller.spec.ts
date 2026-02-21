import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn()
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn().mockImplementation((context) => {
      const req = context.switchToHttp().getRequest();
      req.user = { id: 'test-user-id', username: 'testuser' };
      return true;
    })
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        }
      ]
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      username: 'testuser',
      password: 'password123'
    };

    it('should call authService.register with correct DTO', async () => {
      const expectedResult = {
        access_token: 'jwt-token',
        user: { id: 'user-id', username: 'testuser' }
      };
      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      username: 'testuser',
      password: 'password123'
    };

    it('should call authService.login with correct DTO', async () => {
      const expectedResult = {
        access_token: 'jwt-token',
        user: { id: 'user-id', username: 'testuser' }
      };
      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('logout', () => {
    it('should return success message', async () => {
      const req = {
        user: { id: 'test-user-id', username: 'testuser' }
      };

      const result = await controller.logout(req as any);

      expect(result).toEqual({
        message: 'Logged out successfully',
        user: 'testuser'
      });
    });

    it('should work even without user', async () => {
      const req = {};

      const result = await controller.logout(req as any);

      expect(result).toEqual({
        message: 'Logged out successfully',
        user: undefined
      });
    });
  });
});