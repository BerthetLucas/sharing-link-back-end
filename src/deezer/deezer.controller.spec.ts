import { Test, TestingModule } from '@nestjs/testing';
import { DeezerController } from './deezer.controller';

describe('DeezerController', () => {
  let controller: DeezerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeezerController],
    }).compile();

    controller = module.get<DeezerController>(DeezerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
