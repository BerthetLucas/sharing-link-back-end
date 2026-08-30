export interface OdesliLink {
  url: string;
  entityUniqueId: string;
}

export interface OdesliEntity {
  title?: string;
  artistName?: string;
  thumbnailUrl?: string;
}

export interface OdesliApiResponse {
  entityUniqueId: string;
  pageUrl: string;
  entitiesByUniqueId: Record<string, OdesliEntity>;
  linksByPlatform: Record<string, OdesliLink>;
}

export interface SongLinkPlatform {
  platform: string;
  url: string;
}

export interface SongLinkData {
  pageUrl: string;
  thumbnail?: string;
  title?: string;
  artist?: string;
  platforms: SongLinkPlatform[];
}

export interface SongLinkResponse {
  message: string;
  data: SongLinkData;
}
