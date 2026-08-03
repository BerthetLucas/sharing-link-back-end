import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import type { OdesliApiResponse, SongLinkData, SongLinkPlatform } from './types';

const ODESLI_API_URL = 'https://api.song.link/v1-alpha.1/links';

@Injectable()
export class SongLinkService {
  private readonly logger = new Logger(SongLinkService.name);

  constructor(private readonly httpService: HttpService) {}

  async getSongLinks(url: string): Promise<SongLinkData> {
    try {
      const response = await lastValueFrom(
        this.httpService.get<OdesliApiResponse>(ODESLI_API_URL, { params: { url } }),
      );

      const odesli = response.data;
      const platforms: SongLinkPlatform[] = Object.entries(odesli.linksByPlatform).map(
        ([platform, link]) => ({
          platform,
          url: link.url,
        }),
      );

      if (!platforms.length) {
        throw new BadRequestException('No links found for this URL');
      }

      const entity = odesli.entitiesByUniqueId[odesli.entityUniqueId];

      return {
        pageUrl: odesli.pageUrl,
        thumbnail: entity?.thumbnailUrl,
        title: entity?.title,
        artist: entity?.artistName,
        platforms,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Songlink API error', error);
      throw new BadRequestException('Songlink API error');
    }
  }
}
