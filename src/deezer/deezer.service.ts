import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class DeezerService {
  constructor(private readonly httpService: HttpService) {}

  async searchDeezerSongByMetaData(
    artist: string,
    album: string,
    track: string,
  ): Promise<{ link: string; cover: string }> {
    const query = `artist:"${artist}" album:"${album}" track:"${track}"`;

    const response = await lastValueFrom(
      this.httpService.get('https://api.deezer.com/search', {
        params: { q: query },
      }),
    );

    const link = response.data.data[0].link as string;
    const cover = response.data.data[0].album.cover_big as string;

    return { link, cover };
  }

  async getDeezerSongId(url: string): Promise<string | undefined> {
    const response = await lastValueFrom(this.httpService.get(`${url}`));

    const html = response.data as string;

    const identifyLink = /https:\/\/www\.deezer\.com\/fr\/track\/\d+/i.exec(html);
    const deezerId: string | undefined = identifyLink ? identifyLink[0].split('/').pop() : '';

    return deezerId;
  }

  async getDeezerSongById(id: string): Promise<{ album: string; artist: string; track: string }> {
    const response = await lastValueFrom(
      this.httpService.get(`https://api.deezer.com/track/${id}`),
    );

    const track = response.data.title as string;
    const album = response.data.album.title as string;
    const artist = response.data.artist.name as string;

    return { album, artist, track };
  }
}
