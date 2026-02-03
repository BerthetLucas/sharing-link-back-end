export interface DeezerQuery {
  artist: string;
  album: string;
  track: string;
}

export interface DeezerSongResponse {
  message: string;
  data: unknown;
}
