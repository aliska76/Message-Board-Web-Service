import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { QueryFailedError } from 'typeorm';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    create: jest.fn(),
    findByUsername: jest.fn()
  };

  const mockJwtService = {
    sign: jest.fn()
  };

  const mockUserRepository = {};

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService
        },
        {
          provide: JwtService,
          useValue: mockJwtService
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository
        }
      ]
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(usersService).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      username: 'testuser',
      password: 'password123'
    };

    const mockUser = {
      id: 'user-id-123',
      username: 'testuser',
      passwordHash: 'hashed-password'
    };

    beforeEach(() => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    });

    it('should successfully register a new user', async () => {
      // Arrange
      mockUsersService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(usersService.create).toHaveBeenCalledWith('testuser', 'hashed-password');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-id-123',
        username: 'testuser'
      });
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: 'user-id-123',
          username: 'testuser'
        }
      });
    });

    it('should throw ConflictException when username already exists', async () => {
      // Arrange
      const queryFailedError = new QueryFailedError('query', [], new Error('SQLITE_CONSTRAINT: UNIQUE constraint failed: users.username'));
      (queryFailedError as any).driverError = { code: 'SQLITE_CONSTRAINT' };

      mockUsersService.create.mockRejectedValue(queryFailedError);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto)).rejects.toThrow('Username already exists');

      expect(usersService.create).toHaveBeenCalledWith('testuser', 'hashed-password');
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      // Arrange
      const genericError = new Error('Database connection failed');
      mockUsersService.create.mockRejectedValue(genericError);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(InternalServerErrorException);
      await expect(service.register(registerDto)).rejects.toThrow('Registration failed');
    });

    it('should not throw ConflictException for non-username constraint errors', async () => {
      // Arrange
      const queryFailedError = new QueryFailedError('query', [], new Error('SQLITE_CONSTRAINT: FOREIGN KEY constraint failed'));
      (queryFailedError as any).driverError = { code: 'SQLITE_CONSTRAINT' };

      mockUsersService.create.mockRejectedValue(queryFailedError);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(InternalServerErrorException);
      await expect(service.register(registerDto)).rejects.toThrow('Registration failed');
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      username: 'testuser',
      password: 'password123'
    };

    const mockUser = {
      id: 'user-id-123',
      username: 'testuser',
      passwordHash: 'hashed-password'
    };

    beforeEach(() => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    });

    it('should successfully login a user', async () => {
      // Arrange
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(usersService.findByUsername).toHaveBeenCalledWith('testuser');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-id-123',
        username: 'testuser'
      });
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: 'user-id-123',
          username: 'testuser'
        }
      });
    });

    it('should throw InvalidCredentialsException when user not found', async () => {
      // Arrange
      mockUsersService.findByUsername.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow('Invalid username or password');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw InvalidCredentialsException when password is invalid', async () => {
      // Arrange
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow('Invalid username or password');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
    });

    it('should throw error when database fails during login', async () => {
      // Arrange
      const dbError = new Error('Database error');
      mockUsersService.findByUsername.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow('Database error');
    });
  });

  describe('generateToken', () => {
    it('should generate token for user', () => {
      // Arrange
      const user = { id: 'user-id', username: 'testuser' };
      mockJwtService.sign.mockReturnValue('generated-jwt-token');

      const result = (service as any).generateToken(user);

      // Assert
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-id',
        username: 'testuser'
      });
      expect(result).toEqual({
        access_token: 'generated-jwt-token',
        user: {
          id: 'user-id',
          username: 'testuser'
        }
      });
    });
  });
});