import { Test, TestingModule } from '@nestjs/testing';
import { SongLinkController } from './songlink.controller';
import { SongLinkService } from './songlink.service';
import type { SongLinkData } from './types';

describe('SongLinkController', () => {
  let controller: SongLinkController;
  let service: { getSongLinks: jest.Mock };

  beforeEach(async () => {
    service = { getSongLinks: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SongLinkController],
      providers: [{ provide: SongLinkService, useValue: service }],
    }).compile();

    controller = module.get<SongLinkController>(SongLinkController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns the songlink data wrapped in a message envelope', async () => {
    const data: SongLinkData = {
      pageUrl: 'https://song.link/s/123',
      platforms: [{ platform: 'spotify', url: 'https://open.spotify.com/track/123' }],
    };
    service.getSongLinks.mockResolvedValue(data);

    const result = await controller.getSongLinks({ url: 'https://open.spotify.com/track/123' });

    expect(service.getSongLinks).toHaveBeenCalledWith('https://open.spotify.com/track/123');
    expect(result).toEqual({ message: 'found', data });
  });
});
