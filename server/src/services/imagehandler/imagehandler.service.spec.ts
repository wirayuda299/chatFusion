import { Test, TestingModule } from '@nestjs/testing';
import { ImagehandlerService } from './imagehandler.service';

describe('ImagehandlerService', () => {
  let service: ImagehandlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImagehandlerService],
    }).compile();

    service = module.get<ImagehandlerService>(ImagehandlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
