import { Test, TestingModule } from '@nestjs/testing';
import { VictimMappingService } from './victim-mapping.service';

describe('VictimMappingService', () => {
  let service: VictimMappingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VictimMappingService],
    }).compile();

    service = module.get<VictimMappingService>(VictimMappingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
