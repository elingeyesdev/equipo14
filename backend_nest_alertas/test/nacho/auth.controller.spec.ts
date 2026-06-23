import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from 'app/http/controllers/auth.controller';
import { AuthService } from 'app/services/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call authService.register with user data', async () => {
      const dto = {
        first_name: 'John',
        last_name: 'Doe',
        phone: '123456789',
        password: 'password123',
        role_id: 1,
      } as any;

      mockAuthService.register.mockResolvedValue({ id: '1', ...dto });

      const result = await controller.create(dto);
      expect(result).toEqual({ id: '1', ...dto });
      expect(service.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should call authService.login with req.user', async () => {
      const req = {
        user: { id: '1', phone: '123456789' },
      };

      const loginResponse = { access_token: 'jwt-token', refresh_token: 'refresh-token' };
      mockAuthService.login.mockResolvedValue(loginResponse);

      const result = await controller.login(req);
      expect(result).toEqual(loginResponse);
      expect(service.login).toHaveBeenCalledWith(req.user);
    });
  });

  describe('me', () => {
    it('should return user directly if it has id and phone', async () => {
      const req = {
        user: { id: '1', phone: '123456789' },
      };

      const result = await controller.me(req);
      expect(result).toEqual(req.user);
    });

    it('should map user through UserResponse if id and phone are not present directly', async () => {
      const mockUser = {
        id: '2',
        first_name: 'Jane',
        last_name: 'Doe',
        phone: '987654321',
        role: { id: 2, name: 'user' },
        authority_profile: null,
      } as any;

      const req = {
        user: mockUser,
      };

      const result = await controller.me(req);
      expect(result.id).toBe('2');
      expect(result.first_name).toBe('Jane');
    });
  });

  describe('refresh', () => {
    it('should call authService.refreshToken with token', async () => {
      const token = 'some-refresh-token';
      const refreshResponse = { access_token: 'new-jwt-token' };
      mockAuthService.refreshToken.mockResolvedValue(refreshResponse);

      const result = await controller.refresh(token);
      expect(result).toEqual(refreshResponse);
      expect(service.refreshToken).toHaveBeenCalledWith(token);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with user id', async () => {
      const req = {
        user: { id: '1' },
      };
      mockAuthService.logout.mockResolvedValue({ message: 'Logged out successfully' });

      const result = await controller.logout(req);
      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(service.logout).toHaveBeenCalledWith('1');
    });
  });
});
