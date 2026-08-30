import { HttpService } from '@nestjs/axios';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { SongLinkService } from './songlink.service';
import type { OdesliApiResponse } from './types';

describe('SongLinkService', () => {
  let service: SongLinkService;
  let httpService: { get: jest.Mock };

  beforeEach(async () => {
    httpService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SongLinkService, { provide: HttpService, useValue: httpService }],
    }).compile();

    service = module.get<SongLinkService>(SongLinkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('maps an Odesli response to the simplified SongLinkData shape', async () => {
    const odesliResponse: OdesliApiResponse = {
      entityUniqueId: 'SPOTIFY_SONG::123',
      pageUrl: 'https://song.link/s/123',
      entitiesByUniqueId: {
        'SPOTIFY_SONG::123': {
          title: 'Smells Like Teen Spirit',
          artistName: 'Nirvana',
          thumbnailUrl: 'https://example.com/cover.jpg',
        },
      },
      linksByPlatform: {
        spotify: { url: 'https://open.spotify.com/track/123', entityUniqueId: 'SPOTIFY_SONG::123' },
        deezer: { url: 'https://www.deezer.com/track/456', entityUniqueId: 'DEEZER_SONG::456' },
      },
    };

    httpService.get.mockReturnValue(of({ data: odesliResponse }));

    const result = await service.getSongLinks('https://open.spotify.com/track/123');

    expect(result).toEqual({
      pageUrl: 'https://song.link/s/123',
      thumbnail: 'https://example.com/cover.jpg',
      title: 'Smells Like Teen Spirit',
      artist: 'Nirvana',
      platforms: [
        { platform: 'spotify', url: 'https://open.spotify.com/track/123' },
        { platform: 'deezer', url: 'https://www.deezer.com/track/456' },
      ],
    });
  });

  it('throws BadRequestException when Odesli returns no links', async () => {
    const odesliResponse: OdesliApiResponse = {
      entityUniqueId: 'SPOTIFY_SONG::123',
      pageUrl: 'https://song.link/s/123',
      entitiesByUniqueId: {},
      linksByPlatform: {},
    };

    httpService.get.mockReturnValue(of({ data: odesliResponse }));

    await expect(service.getSongLinks('https://open.spotify.com/track/123')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('wraps upstream/network errors in a BadRequestException', async () => {
    httpService.get.mockReturnValue(throwError(() => new Error('network down')));

    await expect(service.getSongLinks('https://open.spotify.com/track/123')).rejects.toThrow(
      BadRequestException,
    );
  });
});
