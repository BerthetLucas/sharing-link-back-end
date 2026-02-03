import { Controller, Get, HttpCode, HttpStatus, Query, Param } from '@nestjs/common';
import { DeezerService } from './deezer.service';
import type { DeezerQuery, DeezerSongInfoResponse, DeezerSongLinkAndCoverResponse } from './types';

@Controller('deezer')
export class DeezerController {
  constructor(private deezerService: DeezerService) {}

  @Get('/search')
  @HttpCode(HttpStatus.OK)
  async getDeezerSong(
    @Query() query: DeezerQuery,
  ): Promise<DeezerSongLinkAndCoverResponse | HttpStatus> {
    const { artist, album, track } = query;
    const data = await this.deezerService.searchDeezerSongByMetaData(artist, album, track);

    if (!data) {
      return HttpStatus.BAD_REQUEST;
    }

    return {
      message: 'found',
      data,
    };
  }

  @Get('/url')
  @HttpCode(HttpStatus.OK)
  async getDeezerId(
    @Query('url') url: string,
  ): Promise<{ message: string; data?: string } | HttpStatus> {
    const data = await this.deezerService.getDeezerSongId(url);

    if (!data) {
      return HttpStatus.BAD_REQUEST;
    }

    return {
      message: 'found',
      data,
    };
  }

  @Get('id/:id')
  @HttpCode(HttpStatus.OK)
  async getDeezerSongById(@Param('id') id: string): Promise<DeezerSongInfoResponse | HttpStatus> {
    const data = await this.deezerService.getDeezerSongById(id);

    if (!data) {
      return HttpStatus.BAD_REQUEST;
    }

    return {
      message: 'found',
      data,
    };
  }
}
