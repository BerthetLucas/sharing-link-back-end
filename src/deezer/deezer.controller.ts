import { Controller, Get, HttpCode, HttpStatus, Query, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeezerService } from './deezer.service';
import { SearchDto } from './dto/search.dto';
import { UrlDto } from './dto/url.dto';
import type { DeezerSongInfoResponse, DeezerSongLinkAndCoverResponse } from './types';

@ApiTags('deezer')
@Controller('deezer')
export class DeezerController {
  constructor(private deezerService: DeezerService) {}

  @Get('/search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search a Deezer track by artist, album and track name' })
  @ApiResponse({ status: 200, description: 'Track found' })
  @ApiResponse({ status: 400, description: 'Track not found or Deezer API error' })
  async getDeezerSong(@Query() query: SearchDto): Promise<DeezerSongLinkAndCoverResponse> {
    const { artist, album, track } = query;
    const data = await this.deezerService.searchDeezerSongByMetaData(artist, album, track);
    return { message: 'found', data };
  }

  @Get('/url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Extract a Deezer track ID from a share URL' })
  @ApiResponse({ status: 200, description: 'ID extracted successfully' })
  @ApiResponse({ status: 400, description: 'Could not extract ID from URL' })
  async getDeezerId(@Query() query: UrlDto): Promise<{ message: string; data: string }> {
    const data = await this.deezerService.getDeezerSongId(query.url);
    return { message: 'found', data };
  }

  @Get('id/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get track metadata by Deezer track ID' })
  @ApiParam({ name: 'id', description: 'Deezer track ID', example: '3135556' })
  @ApiResponse({ status: 200, description: 'Track metadata returned' })
  @ApiResponse({ status: 400, description: 'Track not found or Deezer API error' })
  async getDeezerSongById(@Param('id') id: string): Promise<DeezerSongInfoResponse> {
    const data = await this.deezerService.getDeezerSongById(id);
    return { message: 'found', data };
  }
}
