import { Test, TestingModule } from '@nestjs/testing';
import { EmergencyStationController } from 'app/http/controllers/emergency-station.controller';
import { EmergencyStationService } from 'app/services/emergency-station.service';

describe('EmergencyStationController', () => {
  let controller: EmergencyStationController;
  let service: EmergencyStationService;

  const mockEmergencyStationService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmergencyStationController],
      providers: [
        {
          provide: EmergencyStationService,
          useValue: mockEmergencyStationService,
        },
      ],
    }).compile();

    controller = module.get<EmergencyStationController>(EmergencyStationController);
    service = module.get<EmergencyStationService>(EmergencyStationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call emergencyStationService.findAll', async () => {
      const stations = [{ id: 1, name: 'Police Station Central' }];
      mockEmergencyStationService.findAll.mockResolvedValue(stations);

      const result = await controller.findAll();
      expect(result).toEqual(stations);
      expect(service.findAll).toHaveBeenCalled();
    });
  });
});
