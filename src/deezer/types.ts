export interface DeezerQuery {
  artist: string;
  album: string;
  track: string;
}

export interface DeezerSongInfoResponse {
  message: string;
  data: {
    artist: string;
    album: string;
    track: string;
  };
}

export interface DeezerSongLinkAndCoverResponse {
  message: string;
  data: {
    link: string;
    cover: string;
  };
}
