import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/interfaces/user.interface';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { LocalStrategy } from './local.strategy';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  let userModel: Model<User>;

  beforeEach(async () => {
    const mockUser = {
      _id: '1',
      username: 'john_doe',
      password: await bcrypt.hash('password123', 10),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        JwtService,
        LocalStrategy,
        LocalAuthGuard,
        JwtAuthGuard,
        {
          provide: 'USER_MODEL',
          useValue: {
            new: jest.fn().mockResolvedValue(mockUser),
            constructor: jest.fn().mockResolvedValue(mockUser),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            exec: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userModel = module.get<Model<User>>('USER_MODEL');
  });

  describe('registerUser', () => {
    it('should return null when provided password is too weak', async () => {
      // Arrange
      const weakPasswordUser = { username: 'new_user', password: 'weak' };

      // Assert
      expect(
        authService.register(weakPasswordUser as User),
      ).rejects.toThrowError(BadRequestException);
    });

    it('should return null when the username is already taken', async () => {
      // Arrange
      const mockUser = {
        _id: '1',
        username: 'john_doe',
        password: await bcrypt.hash('password123', 10),
      };

      // Adjust the type of findOne
      jest.spyOn(userModel, 'findOne').mockReturnValueOnce({
        exec: jest
          .fn()
          .mockResolvedValueOnce({ username: 'existing_user' } as User),
      } as any);

      // Act
      const result = await authService.register(mockUser as User);
      // Assert
      expect(result).toBeNull();
    });
  });

  describe('validateUser', () => {
    it('should return a user when credentials are valid', async () => {
      // Arrange
      const mockUser = {
        _id: '1',
        username: 'john_doe',
        password: await bcrypt.hash('password123', 10),
      };

      jest.spyOn(userModel, 'findOne').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce(mockUser as any),
      } as any);

      // Act
      const result = await authService.validateUser('john_doe', 'password123');

      // Assert
      expect(result).toEqual(mockUser);
    });

    it('should return null when credentials are invalid', async () => {
      const mockUser = {
        _id: '1',
        username: 'john_doe',
        password: await bcrypt.hash('password123', 10),
      };
      const invalidMockUser = {
        _id: '3',
        username: 'invalid_user',
        password: await bcrypt.hash('invalid_pass', 10),
      };

      // Arrange
      jest.spyOn(userModel, 'findOne').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce(mockUser as any),
      } as any);

      // Act
      const result = await authService.validateUser(
        invalidMockUser.username,
        invalidMockUser.password,
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when both username and password are empty', async () => {
      jest.spyOn(userModel, 'findOne').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce(null),
      } as any);

      // Arrange
      const result = await authService.validateUser('', '');
      // Assert
      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      const mockUser = {
        _id: '1',
        username: 'john_doe',
        password: await bcrypt.hash('password123', 10),
      };
      // Arrange
      jest.spyOn(userModel, 'findOne').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce(mockUser as any),
      } as any);

      const result = await authService.validateUser(
        'john_doe',
        'incorrect_password',
      );
      // Assert
      expect(result).toBeNull();
    });

    it('should return null when user with the provided username does not exist', async () => {
      // Arrange
      jest.spyOn(userModel, 'findOne').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce(null),
      } as any);

      // Act
      const result = await authService.validateUser(
        'nonexistent_user',
        'password123',
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('validateUserById', () => {
    it('should return a user when a valid ID is provided', async () => {
      // Arrange
      const validUserId = 1;
      jest.spyOn(userModel, 'findOne').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce({ _id: validUserId } as User),
      } as any);

      // Act
      const result = await authService.validateUserById(validUserId);

      // Assert
      expect(result).toBeDefined();
      expect(result?._id).toBe(validUserId);
    });

    it('should return null when an invalid ID is provided', async () => {
      // Arrange
      const invalidUserId = 2;
      jest.spyOn(userModel, 'findOne').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce(null),
      } as any);

      // Act
      const result = await authService.validateUserById(invalidUserId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return an access token when provided with a valid user', async () => {
      // Arrange
      const validUser = {
        _id: '1',
        username: 'john_doe',
        password: await bcrypt.hash('password123', 10),
      };

      // Mock the JwtService
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce('mockedAccessToken');

      // Act
      const result = await authService.login(validUser as User);

      // Assert
      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mockedAccessToken');

      // Ensure JwtService was called with the correct payload
      expect(jwtService.sign).toHaveBeenCalledWith({
        username: validUser.username,
        sub: validUser._id,
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
