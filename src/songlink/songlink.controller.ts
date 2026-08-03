import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SongLinkService } from './songlink.service';
import { UrlDto } from './dto/url.dto';
import type { SongLinkResponse } from './types';

@ApiTags('songlink')
@Controller('songlink')
export class SongLinkController {
  constructor(private songLinkService: SongLinkService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get equivalent streaming links across platforms for a share URL' })
  @ApiResponse({ status: 200, description: 'Links found' })
  @ApiResponse({ status: 400, description: 'Could not resolve links for this URL' })
  async getSongLinks(@Query() query: UrlDto): Promise<SongLinkResponse> {
    const data = await this.songLinkService.getSongLinks(query.url);
    return { message: 'found', data };
  }
}
