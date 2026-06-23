import { Test, TestingModule } from '@nestjs/testing';
import { MailController } from 'app/http/controllers/mail.controller';
import { MailService } from 'app/services/mail.service';

describe('MailController', () => {
  let controller: MailController;
  let service: MailService;

  const mockMailService = {
    sendMailToUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailController],
      providers: [
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    controller = module.get<MailController>(MailController);
    service = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendMail', () => {
    it('should call mailService.sendMailToUser', async () => {
      mockMailService.sendMailToUser.mockResolvedValue({ success: true });

      const body = { subject: 'Test Subject', content: 'Test Content' };
      const result = await controller.sendMail('user-id-123', body);

      expect(result).toEqual({ success: true });
      expect(service.sendMailToUser).toHaveBeenCalledWith('user-id-123', 'Test Subject', 'Test Content');
    });
  });
});
