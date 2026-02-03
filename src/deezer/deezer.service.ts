import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { catchError } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class DeezerService {
  constructor(private readonly httpService: HttpService) {}

  async searchDeezerSongByMetaData(artist: string, album: string, track: string): Promise<unknown> {
    const query = `artist:"${artist}" album:"${album}" track:"${track}"`;
    const { data } = await lastValueFrom(
      this.httpService
        .get('https://api.deezer.com/search', {
          params: { q: query },
        })
        .pipe(
          catchError((err: AxiosError) => {
            throw new Error(
              `Deezer API error: ${err.response?.status ?? err.message} - ${JSON.stringify(err.response?.data ?? err.message)}`,
            );
          }),
        ),
    );

    return data;
  }

  async getDeezerSongById(id: string): Promise<unknown> {
    const { data } = await lastValueFrom(
      this.httpService.get(`https://api.deezer.com/track/${id}`).pipe(
        catchError((err: AxiosError) => {
          throw new Error(
            `Deezer API error: ${err.response?.status ?? err.message} - ${JSON.stringify(err.response?.data ?? err.message)}`,
          );
        }),
      ),
    );

    return data;
  }

  async getDeezerSongId(url: string): Promise<unknown> {
    const response = await lastValueFrom(this.httpService.get(`${url}`));

    const html = response.data as string;

    const identifyLink = /https:\/\/www\.deezer\.com\/fr\/track\/\d+/i.exec(html);

    const deezerId: string | undefined = identifyLink ? identifyLink[0].split('/').pop() : '';

    return deezerId;
  }
}
