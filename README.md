# Sharing Link — Back-end

API NestJS qui résout un lien de partage de streaming musical (Spotify, Deezer, etc.) en liens équivalents pour toutes les plateformes, via l'API **Songlink/Odesli**.

## Stack

- **Node.js** + **TypeScript**
- **NestJS** 11
- **pnpm**
- **Axios** (via `@nestjs/axios`) pour les appels HTTP vers l’API Songlink/Odesli

## Prérequis

- Node.js (version supportée par NestJS 11)
- pnpm

## Installation et lancement

```bash
# Installer les dépendances
pnpm install

# Lancer en développement (watch)
pnpm run start:dev

# Lancer en production
pnpm run build
pnpm run start:prod
```

Par défaut, l’API écoute sur le port **3000** (ou la variable d’environnement `PORT`).

## Tests

```bash
# Tests unitaires
pnpm run test

# Tests e2e
pnpm run test:e2e

# Couverture
pnpm run test:cov
```

## Architecture du projet

```
src/
├── main.ts                 # Point d’entrée, bootstrap NestJS
├── app.module.ts           # Module racine
├── app.controller.ts       # Contrôleur racine (ex: GET /)
├── app.service.ts
└── songlink/
    ├── songlink.module.ts     # Module Songlink (HttpModule, controller, service)
    ├── songlink.controller.ts # Route /songlink
    ├── songlink.service.ts    # Logique métier + appel API Songlink/Odesli
    ├── dto/url.dto.ts          # Validation de l'URL en entrée
    └── types.ts                # Interfaces (réponse Odesli, réponse simplifiée)
```

### Rôle des couches

| Couche        | Rôle |
|---------------|------|
| **Controller** | Expose la route HTTP, valide les paramètres, délègue au service et formate les réponses. |
| **Service**    | Logique métier et appel à l’API Songlink/Odesli (`api.song.link`). |
| **Module**    | Regroupe controller, service et dépendances (ex. `HttpModule`). |

### Module Songlink

- **Import** : `HttpModule` (Axios) avec timeout 10s et max 5 redirects.
- **Endpoint** :
  - `GET /songlink?url=` — résout un lien de partage (Spotify, Deezer, Apple Music, etc.) et retourne les liens équivalents pour toutes les plateformes disponibles, plus titre/artiste/pochette.

Les réponses sont au format `{ message: 'found', data: { pageUrl, thumbnail?, title?, artist?, platforms: [{platform, url}] } }`. En cas d’échec (URL invalide, aucun résultat, erreur amont), le contrôleur renvoie `400 Bad Request`.

### Flux de données

1. Le client appelle `GET /songlink?url=`.
2. Le `SongLinkController` valide l’URL puis délègue au `SongLinkService`.
3. Le service appelle l’API Songlink/Odesli (`HttpService`/Axios) et simplifie la réponse.
4. Le controller renvoie les données formatées ou un code d’erreur.

## Scripts utiles

| Commande           | Description              |
|--------------------|--------------------------|
| `pnpm run start`   | Démarrer l’app           |
| `pnpm run start:dev` | Démarrer en mode watch |
| `pnpm run build`   | Compiler (output dans `dist/`) |
| `pnpm run lint`    | Linter + fix             |
| `pnpm run format`  | Prettier sur `src` et `test` |

## Licence

UNLICENSED (projet privé).
