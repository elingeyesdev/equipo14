import { Test, TestingModule } from '@nestjs/testing';
import { ReportTypeController } from 'app/http/controllers/report-types.controller';
import { ReportTypesService } from 'app/services/report-types.service';

describe('ReportTypeController', () => {
  let controller: ReportTypeController;
  let service: ReportTypesService;

  const mockReportTypesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportTypeController],
      providers: [
        {
          provide: ReportTypesService,
          useValue: mockReportTypesService,
        },
      ],
    }).compile();

    controller = module.get<ReportTypeController>(ReportTypeController);
    service = module.get<ReportTypesService>(ReportTypesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call reportTypesService.create', async () => {
      mockReportTypesService.create.mockResolvedValue({ id: 1, name: 'accident' });

      const result = await controller.create('accident');
      expect(result).toEqual({ id: 1, name: 'accident' });
      expect(service.create).toHaveBeenCalledWith('accident');
    });
  });

  describe('findAll', () => {
    it('should call reportTypesService.findAll', async () => {
      const typesList = [{ id: 1, name: 'accident' }];
      mockReportTypesService.findAll.mockResolvedValue(typesList);

      const result = await controller.findAll();
      expect(result).toEqual(typesList);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should call reportTypesService.remove', async () => {
      mockReportTypesService.remove.mockResolvedValue({ message: 'Report type deleted' });

      const result = await controller.remove(1);
      expect(result).toEqual({ message: 'Report type deleted' });
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
