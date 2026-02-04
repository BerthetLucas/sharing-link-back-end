# Sharing Link — Back-end

API NestJS qui expose des endpoints pour interagir avec **Deezer** : recherche de titres par métadonnées, extraction d’ID à partir d’une URL, et récupération des infos d’un morceau par ID.

## Stack

- **Node.js** + **TypeScript**
- **NestJS** 11
- **pnpm**
- **Axios** (via `@nestjs/axios`) pour les appels HTTP vers l’API Deezer

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
└── deezer/
    ├── deezer.module.ts     # Module Deezer (HttpModule, controller, service)
    ├── deezer.controller.ts # Routes /deezer/*
    ├── deezer.service.ts    # Logique métier + appels API Deezer
    └── types.ts             # Interfaces (query, réponses)
```

### Rôle des couches

| Couche        | Rôle |
|---------------|------|
| **Controller** | Expose les routes HTTP, valide les paramètres, délègue au service et formate les réponses. |
| **Service**    | Logique métier et appels à l’API Deezer (`api.deezer.com`). |
| **Module**    | Regroupe controller, service et dépendances (ex. `HttpModule`). |

### Module Deezer

- **Import** : `HttpModule` (Axios) avec timeout 10s et max 5 redirects.
- **Endpoints** :
  - `GET /deezer/search?artist=&album=&track=` — recherche par artiste/album/titre, retourne `link` et `cover`.
  - `GET /deezer/url?url=` — extrait l’ID du track Deezer à partir d’une URL (ex. lien de partage).
  - `GET /deezer/id/:id` — infos du morceau (artist, album, track) pour un ID donné.

Les réponses sont au format `{ message: 'found', data: ... }`. En cas d’échec, le contrôleur renvoie `400 Bad Request`.

### Flux de données

1. Le client appelle une route du `DeezerController`.
2. Le controller appelle le `DeezerService` (search par metadata, extraction d’ID depuis URL, ou infos par ID).
3. Le service utilise `HttpService` (Axios) pour appeler l’API Deezer.
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
