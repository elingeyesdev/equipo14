import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from 'app/http/controllers/roles.controller';
import { RolesService } from 'app/services/roles.service';

describe('RolesController', () => {
  let controller: RolesController;
  let service: RolesService;

  const mockRolesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
    service = module.get<RolesService>(RolesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call rolesService.create', async () => {
      mockRolesService.create.mockResolvedValue({ id: 1, name: 'admin' });

      const result = await controller.create('admin', {} as any);
      expect(result).toEqual({ id: 1, name: 'admin' });
      expect(service.create).toHaveBeenCalledWith('admin');
    });
  });

  describe('findAll', () => {
    it('should call rolesService.findAll', async () => {
      const rolesList = [{ id: 1, name: 'admin' }];
      mockRolesService.findAll.mockResolvedValue(rolesList);

      const result = await controller.findAll();
      expect(result).toEqual(rolesList);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should call rolesService.remove', async () => {
      mockRolesService.remove.mockResolvedValue({ message: 'Role deleted' });

      const result = await controller.remove(1);
      expect(result).toEqual({ message: 'Role deleted' });
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
