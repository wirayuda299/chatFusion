import { Test, TestingModule } from '@nestjs/testing';
import { ReactionsController } from './reactions.controller';

describe('ReactionsController', () => {
  let controller: ReactionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReactionsController],
    })
      .useMocker(() => ({}))
      .compile();

    controller = module.get<ReactionsController>(ReactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
