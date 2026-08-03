# Migration Deezer API → Songlink (Odesli) API

## Contexte

Backend actuel n'utilise que l'API Deezer (recherche par métadonnées, extraction d'ID depuis lien de partage, fetch track par ID). Front-end (`sharing-links-transformer`) fait une résolution bidirectionnelle Spotify↔Deezer via matching de métadonnées (artiste/album/titre), ce qui est fragile et limité à 2 plateformes.

L'API Songlink (Odesli, `https://api.song.link/v1-alpha.1/links`) résout un lien de partage de n'importe quelle plateforme de streaming musical et renvoie les liens équivalents pour toutes les plateformes supportées (Spotify, Deezer, Apple Music, YouTube Music, Tidal, Amazon Music, SoundCloud, etc.) en un seul appel, y compris pour les liens raccourcis (`dzr.page.link`, etc.).

Pas de clé API : Odesli n'offre plus d'inscription self-serve publique. L'usage non-authentifié fonctionne, limité à ~10 req/min — suffisant pour ce projet. Ajout d'une clé possible plus tard si le rate limit pose problème (variable d'env à ce moment-là).

## Scope

Backend (`sharing-link-back-end`) + Front-end (`sharing-links-transformer`). Remplacement complet du module Deezer, pas de coexistence.

## Backend

### Architecture

Nouveau module `songlink` remplace entièrement le module `deezer` (controller, service, module, dto, types, specs supprimés).

Un seul endpoint :

```
GET /songlink?url=<share-url>
```

Pas d'abstraction "provider" (interface swappable) — YAGNI, un seul provider utilisé. À ajouter seulement si un second provider devient réellement nécessaire.

### Contrat de données

Requête : `UrlDto` (réutilise le même validateur que l'actuel `UrlDto` : `@IsString @IsNotEmpty @IsUrl`).

Réponse :

```ts
{
  message: 'found',
  data: {
    pageUrl: string,       // page universelle Odesli
    thumbnail?: string,    // depuis entitiesByUniqueId
    title?: string,
    artist?: string,
    platforms: { platform: string; url: string }[]
  }
}
```

`platforms` est construit en mappant les clés de `linksByPlatform` de la réponse Odesli vers `{platform, url}`, en ignorant le reste (entityUniqueId par lien, apiProvider, nativeAppUriMobile...) — bruit inutile pour le front-end. Toutes les plateformes renvoyées par Odesli sont incluses (pas de filtrage backend).

`title`/`artist`/`thumbnail` : extraits de la première entité dans `entitiesByUniqueId` correspondant à `entityUniqueId` de la réponse.

### Gestion d'erreurs

Même pattern que le service Deezer actuel :
- URL non résolue / pas de résultat Odesli → `BadRequestException` (400)
- Erreur réseau / 5xx Odesli → catch, log, rethrow `BadRequestException` générique (400)

### Fichiers

- `src/songlink/songlink.module.ts`
- `src/songlink/songlink.controller.ts`
- `src/songlink/songlink.service.ts`
- `src/songlink/dto/url.dto.ts` (identique à l'actuel `deezer/dto/url.dto.ts`)
- `src/songlink/types.ts`
- Specs correspondants (`.spec.ts`)
- Suppression complète de `src/deezer/**`

## Front-end

Même design visuel (`SongCard` layout inchangé), simplification du code — pas de refonte visuelle.

### Suppressions

- `DeezerLink.tsx`, `SpotifyLink.tsx`
- `useGetDeezerSong.ts`, `useGetSpotifySong.ts`, `useGetSpotifySongInfo.ts`
- `service/deezer/*`, `service/spotify/*`
- `api/deezer/route.ts`, `api/deezerGetId/route.ts`, `api/deezerGetSong/route.ts`
- `types/deezer.ts`, `types/spotify.ts`

### Modifications

- **`SongCard.tsx`** : prop `platform: string` (au lieu de l'union `'spotify' | 'deezer'`). Description via traduction : clé dédiée si elle existe (`Card.spotifyUser`, `Card.deezerUser`), sinon fallback générique (`Card.genericUser`, avec le nom de plateforme interpolé). Reste du JSX/styles inchangé.
- **`SongResult.tsx`** : remplace le branchement `DeezerLink`/`SpotifyLink` par un seul hook `useGetSongLinks(inputUrl)` (suspense query), puis `.map()` sur `data.platforms` pour rendre un `SongCard` par plateforme (title/artist/cover partagés depuis `data`, `link`+`platform` par item).
- **`useLinkTransformer.ts`** : `handleSubmit` ne fait plus que `setInputUrl` — suppression du `if/else` sur le hostname et de la détection de plateforme.
- **`linksAtoms.ts`** : suppression de `spotifySongIdAtom`, `deezerSongIdAtom`, `deezerSongUrlAtom` (et resets associés). Seul `inputUrlAtom` reste.

### Nouveau

- **`useGetSongLinks(url)`** : hook suspense query, appelle une nouvelle route API Next.js `api/songlink/route.ts` qui proxy vers le backend NestJS `/songlink?url=`.
- **`types/songlink.ts`** : type de réponse (`SongLinkResponse`, miroir du contrat backend).

## Tests

### Backend

- `songlink.service.spec.ts` : mock `HttpService`, teste le mapping de succès + chemins d'erreur (pas de résultat, erreur upstream → 400).
- `songlink.controller.spec.ts` : miroir du pattern `deezer.controller.spec.ts` actuel.
- Suppression des specs Deezer (`deezer.service.spec.ts`, `deezer.controller.spec.ts`).

### Front-end

- `useGetSongLinks` : test avec fetch mocké (succès + erreur).
- `SongCard.test.tsx` : ajuster si nécessaire pour le prop `platform: string` générique.
- E2E : remplacer `share-deezer-link.spec.ts`, `share-spotify-link.spec.ts`, `share-deezer-sharing-link-format.spec.ts` par un seul `share-link.spec.ts` couvrant le flow coller-lien → résultat multi-plateformes.
