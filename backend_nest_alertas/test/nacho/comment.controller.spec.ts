import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from 'app/http/controllers/comment.controller';
import { CommentsService } from 'app/services/comments.service';

describe('CommentsController', () => {
  let controller: CommentsController;
  let service: CommentsService;

  const mockCommentsService = {
    reply: jest.fn(),
    findReplies: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        {
          provide: CommentsService,
          useValue: mockCommentsService,
        },
      ],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
    service = module.get<CommentsService>(CommentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createReply', () => {
    it('should call commentsService.reply', async () => {
      const dto = { content: 'This is a reply' } as any;
      mockCommentsService.reply.mockResolvedValue({ id: 2, comment_id: 1, ...dto });

      const result = await controller.createReply(1, dto);
      expect(result).toEqual({ id: 2, comment_id: 1, ...dto });
      expect(service.reply).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('findReplies', () => {
    it('should call commentsService.findReplies', async () => {
      const replies = [{ id: 2, comment_id: 1, content: 'This is a reply' }];
      mockCommentsService.findReplies.mockResolvedValue(replies);

      const result = await controller.findReplies(1);
      expect(result).toEqual(replies);
      expect(service.findReplies).toHaveBeenCalledWith(1);
    });
  });
});
