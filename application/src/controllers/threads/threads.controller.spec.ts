import { Test, TestingModule } from '@nestjs/testing';
import { ThreadsController } from './threads.controller';

describe('ThreadsController', () => {
  let controller: ThreadsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThreadsController],
    })
      .useMocker(() => ({}))
      .compile();

    controller = module.get<ThreadsController>(ThreadsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
