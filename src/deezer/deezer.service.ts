import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class DeezerService {
  private readonly logger = new Logger(DeezerService.name);

  constructor(private readonly httpService: HttpService) {}

  async searchDeezerSongByMetaData(
    artist: string,
    album: string,
    track: string,
  ): Promise<{ link: string; cover: string }> {
    const query = `artist:"${artist}" album:"${album}" track:"${track}"`;

    try {
      const response = await lastValueFrom(
        this.httpService.get('https://api.deezer.com/search', {
          params: { q: query },
        }),
      );

      const results = response.data?.data;
      if (!results?.length) {
        throw new BadRequestException('Song not found');
      }

      const link = results[0].link as string;
      const cover = results[0].album.cover_big as string;

      return { link, cover };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Deezer search API error', error);
      throw new BadRequestException('Deezer API error');
    }
  }

  async getDeezerSongId(url: string): Promise<string> {
    try {
      const response = await lastValueFrom(this.httpService.get(url));
      const html = response.data as string;

      const match = /https:\/\/www\.deezer\.com\/[a-z]{2}\/track\/(\d+)/i.exec(html);
      if (!match) {
        throw new BadRequestException('Could not extract Deezer ID from URL');
      }

      return match[1];
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Deezer URL fetch error', error);
      throw new BadRequestException('Failed to fetch URL');
    }
  }

  async getDeezerSongById(id: string): Promise<{ album: string; artist: string; track: string }> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`https://api.deezer.com/track/${id}`),
      );

      if (!response.data?.title) {
        throw new BadRequestException('Track not found');
      }

      const track = response.data.title as string;
      const album = response.data.album.title as string;
      const artist = response.data.artist.name as string;

      return { album, artist, track };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Deezer track API error', error);
      throw new BadRequestException('Deezer API error');
    }
  }
}
