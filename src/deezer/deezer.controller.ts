import { BadRequestException, Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { DeezerService } from './deezer.service';
import type { DeezerQuery, DeezerSongResponse } from './types';

@Controller('deezer')
export class DeezerController {
  constructor(private deezerService: DeezerService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getDeezerSong(@Query() query: DeezerQuery): Promise<DeezerSongResponse> {
    const { artist, album, track } = query;
    const data: unknown = await this.deezerService.searchDeezerSongByMetaData(artist, album, track);
    return {
      message: 'found',
      data,
    };
  }

  @Get('/url')
  @HttpCode(HttpStatus.OK)
  async getDeezerId(@Query('url') url: string): Promise<{ message: string; data: unknown }> {
    if (!url?.trim()) {
      throw new BadRequestException(
        'Paramètre "url" requis. Exemple : /deezer/url?url=https://link.deezer.com/s/xxx',
      );
    }
    const data = await this.deezerService.getDeezerSongId(url);
    return {
      message: 'found',
      data,
    };
  }
}
