import { Test, TestingModule } from '@nestjs/testing';
import { AuthorityProfileController } from 'app/http/controllers/authority-profile.controller';
import { AuthorityProfileService } from 'app/services/authority-profile.service';

describe('AuthorityProfileController', () => {
  let controller: AuthorityProfileController;
  let service: AuthorityProfileService;

  const mockAuthorityProfileService = {
    updateByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthorityProfileController],
      providers: [
        {
          provide: AuthorityProfileService,
          useValue: mockAuthorityProfileService,
        },
      ],
    }).compile();

    controller = module.get<AuthorityProfileController>(AuthorityProfileController);
    service = module.get<AuthorityProfileService>(AuthorityProfileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('update', () => {
    it('should call authorityProfileService.updateByUserId', async () => {
      const dto = { ci: '7654321', gmail: 'authority@test.com', profile_type: 'firefighter' } as any;
      mockAuthorityProfileService.updateByUserId.mockResolvedValue({ id: '1', ...dto });

      const result = await controller.update('user-id-123', dto);
      expect(result).toEqual({ id: '1', ...dto });
      expect(service.updateByUserId).toHaveBeenCalledWith('user-id-123', dto);
    });
  });
});
