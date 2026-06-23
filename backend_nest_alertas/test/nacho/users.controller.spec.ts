import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from 'app/http/controllers/users.controller';
import { UsersService } from 'app/services/users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    createAuthUser: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateFcmToken: jest.fn(),
    updateLocation: jest.fn(),
    updatePassword: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createAuthProfile', () => {
    it('should call usersService.createAuthUser', async () => {
      const dto = { ci: '1234567', gmail: 'test@gmail.com', profile_type: 'police' } as any;
      mockUsersService.createAuthUser.mockResolvedValue({ id: '1', ...dto });

      const result = await controller.createAuthProfile(dto);
      expect(result).toEqual({ id: '1', ...dto });
      expect(service.createAuthUser).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should call usersService.findAll', async () => {
      const usersList = [{ id: '1', phone: '123456789' }];
      mockUsersService.findAll.mockResolvedValue(usersList);

      const result = await controller.findAll();
      expect(result).toEqual(usersList);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call usersService.findOne', async () => {
      const mockUser = { id: '1', phone: '123456789' };
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('1');
      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should call usersService.update', async () => {
      const dto = { first_name: 'Jane' } as any;
      mockUsersService.update.mockResolvedValue({ id: '1', first_name: 'Jane' });

      const result = await controller.update('1', dto);
      expect(result).toEqual({ id: '1', first_name: 'Jane' });
      expect(service.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('updateFcmToken', () => {
    it('should call usersService.updateFcmToken', async () => {
      mockUsersService.updateFcmToken.mockResolvedValue({ id: '1', fcm_token: 'new-token' });

      const result = await controller.updateFcmToken('1', 'new-token');
      expect(result).toEqual({ id: '1', fcm_token: 'new-token' });
      expect(service.updateFcmToken).toHaveBeenCalledWith('1', 'new-token');
    });
  });

  describe('updateLocation', () => {
    it('should call usersService.updateLocation', async () => {
      const dto = { latitude: 10.2, longitude: -67.5 } as any;
      mockUsersService.updateLocation.mockResolvedValue({ id: '1', ...dto });

      const result = await controller.updateLocation('1', dto);
      expect(result).toEqual({ id: '1', ...dto });
      expect(service.updateLocation).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('updatePassword', () => {
    it('should call usersService.updatePassword', async () => {
      const dto = { old_password: 'old', new_password: 'new' } as any;
      mockUsersService.updatePassword.mockResolvedValue({ message: 'Password updated' });

      const result = await controller.updatePassword('1', dto);
      expect(result).toEqual({ message: 'Password updated' });
      expect(service.updatePassword).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('remove', () => {
    it('should call usersService.remove', async () => {
      mockUsersService.remove.mockResolvedValue({ message: 'User deleted' });

      const result = await controller.remove('1');
      expect(result).toEqual({ message: 'User deleted' });
      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });
});
