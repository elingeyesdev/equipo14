import { Test, TestingModule } from '@nestjs/testing';
import { ImagesController } from 'app/http/controllers/images.controller';
import { ImagesService } from 'app/services/images.service';

describe('ImagesController', () => {
  let controller: ImagesController;
  let service: ImagesService;

  const mockImagesService = {
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImagesController],
      providers: [
        {
          provide: ImagesService,
          useValue: mockImagesService,
        },
      ],
    }).compile();

    controller = module.get<ImagesController>(ImagesController);
    service = module.get<ImagesService>(ImagesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('remove', () => {
    it('should call imagesService.remove', async () => {
      mockImagesService.remove.mockResolvedValue({ success: true });

      const result = await controller.remove(123);
      expect(result).toEqual({ success: true });
      expect(service.remove).toHaveBeenCalledWith(123);
    });
  });
});
