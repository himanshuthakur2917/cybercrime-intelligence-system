import { Test, TestingModule } from '@nestjs/testing';
import { VictimMappingController } from './victim-mapping.controller';

describe('VictimMappingController', () => {
  let controller: VictimMappingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VictimMappingController],
    }).compile();

    controller = module.get<VictimMappingController>(VictimMappingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
