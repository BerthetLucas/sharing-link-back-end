export interface DeezerQuery {
  artist: string;
  album: string;
  track: string;
}

export interface DeezerApiTrack {
  link: string;
  title: string;
  album: { title: string; cover_big: string };
  artist: { name: string };
}

export interface DeezerApiSearchResponse {
  data: DeezerApiTrack[];
}

export interface DeezerApiTrackResponse {
  title: string;
  album: { title: string };
  artist: { name: string };
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
