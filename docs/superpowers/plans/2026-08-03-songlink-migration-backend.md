# Songlink Migration (Backend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Deezer-only module with a single `songlink` module that proxies the Odesli (Songlink) API, returning links for all platforms for any pasted streaming share URL.

**Architecture:** New NestJS module `src/songlink/` (controller, service, dto, types), same shape as the existing `src/deezer/` module it replaces. One endpoint `GET /songlink?url=`. Service calls `https://api.song.link/v1-alpha.1/links?url=` via `HttpService` (no auth), maps the response to a simplified shape, and deletes `src/deezer/**` entirely.

**Tech Stack:** NestJS, `@nestjs/axios` (`HttpService`/`lastValueFrom`), `class-validator` (`UrlDto`), Jest (`ts-jest`).

## Global Constraints

- No Odesli API key — unauthenticated calls only (rate limit ~10 req/min accepted).
- Full replacement of the Deezer module — no coexistence, no provider abstraction interface.
- Response contract: `{ message: 'found', data: { pageUrl, thumbnail?, title?, artist?, platforms: {platform, url}[] } }`.
- Errors: no result / invalid input → `BadRequestException` (400); upstream failure → caught, logged, rethrown as generic `BadRequestException` (400). Matches existing `DeezerService` error pattern.

---

### Task 1: Songlink types + DTO

**Files:**
- Create: `src/songlink/types.ts`
- Create: `src/songlink/dto/url.dto.ts`
- Test: none (types/DTO have no behavior to unit test in isolation; covered by Task 2's service tests and Task 3's controller tests)

**Interfaces:**
- Produces: `UrlDto` (class with `url: string`, validated), `SongLinkPlatform = { platform: string; url: string }`, `SongLinkData = { pageUrl: string; thumbnail?: string; title?: string; artist?: string; platforms: SongLinkPlatform[] }`, `SongLinkResponse = { message: string; data: SongLinkData }`, `OdesliApiResponse` (raw shape from `api.song.link`).

- [ ] **Step 1: Write `src/songlink/dto/url.dto.ts`**

```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class UrlDto {
  @ApiProperty({ example: 'https://open.spotify.com/track/...' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url: string;
}
```

- [ ] **Step 2: Write `src/songlink/types.ts`**

```ts
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
```

- [ ] **Step 3: Commit**

```bash
git add src/songlink/types.ts src/songlink/dto/url.dto.ts
git commit -m "feat: add songlink types and url dto"
```

---

### Task 2: SongLinkService

**Files:**
- Create: `src/songlink/songlink.service.ts`
- Test: `src/songlink/songlink.service.spec.ts`

**Interfaces:**
- Consumes: `OdesliApiResponse`, `SongLinkData`, `SongLinkPlatform` from Task 1 (`./types`).
- Produces: `SongLinkService` with `async getSongLinks(url: string): Promise<SongLinkData>` — later consumed by Task 3's controller.

- [ ] **Step 1: Write the failing tests**

```ts
// src/songlink/songlink.service.spec.ts
import { HttpService } from '@nestjs/axios';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { SongLinkService } from './songlink.service';
import type { OdesliApiResponse } from './types';

describe('SongLinkService', () => {
  let service: SongLinkService;
  let httpService: { get: jest.Mock };

  beforeEach(async () => {
    httpService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SongLinkService, { provide: HttpService, useValue: httpService }],
    }).compile();

    service = module.get<SongLinkService>(SongLinkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('maps an Odesli response to the simplified SongLinkData shape', async () => {
    const odesliResponse: OdesliApiResponse = {
      entityUniqueId: 'SPOTIFY_SONG::123',
      pageUrl: 'https://song.link/s/123',
      entitiesByUniqueId: {
        'SPOTIFY_SONG::123': {
          title: 'Smells Like Teen Spirit',
          artistName: 'Nirvana',
          thumbnailUrl: 'https://example.com/cover.jpg',
        },
      },
      linksByPlatform: {
        spotify: { url: 'https://open.spotify.com/track/123', entityUniqueId: 'SPOTIFY_SONG::123' },
        deezer: { url: 'https://www.deezer.com/track/456', entityUniqueId: 'DEEZER_SONG::456' },
      },
    };

    httpService.get.mockReturnValue(of({ data: odesliResponse }));

    const result = await service.getSongLinks('https://open.spotify.com/track/123');

    expect(result).toEqual({
      pageUrl: 'https://song.link/s/123',
      thumbnail: 'https://example.com/cover.jpg',
      title: 'Smells Like Teen Spirit',
      artist: 'Nirvana',
      platforms: [
        { platform: 'spotify', url: 'https://open.spotify.com/track/123' },
        { platform: 'deezer', url: 'https://www.deezer.com/track/456' },
      ],
    });
  });

  it('throws BadRequestException when Odesli returns no links', async () => {
    const odesliResponse: OdesliApiResponse = {
      entityUniqueId: 'SPOTIFY_SONG::123',
      pageUrl: 'https://song.link/s/123',
      entitiesByUniqueId: {},
      linksByPlatform: {},
    };

    httpService.get.mockReturnValue(of({ data: odesliResponse }));

    await expect(service.getSongLinks('https://open.spotify.com/track/123')).rejects.toThrow(BadRequestException);
  });

  it('wraps upstream/network errors in a BadRequestException', async () => {
    httpService.get.mockReturnValue(throwError(() => new Error('network down')));

    await expect(service.getSongLinks('https://open.spotify.com/track/123')).rejects.toThrow(BadRequestException);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/songlink/songlink.service.spec.ts`
Expected: FAIL — cannot find module `./songlink.service`.

- [ ] **Step 3: Write `src/songlink/songlink.service.ts`**

```ts
import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import type { OdesliApiResponse, SongLinkData, SongLinkPlatform } from './types';

const ODESLI_API_URL = 'https://api.song.link/v1-alpha.1/links';

@Injectable()
export class SongLinkService {
  private readonly logger = new Logger(SongLinkService.name);

  constructor(private readonly httpService: HttpService) {}

  async getSongLinks(url: string): Promise<SongLinkData> {
    try {
      const response = await lastValueFrom(
        this.httpService.get<OdesliApiResponse>(ODESLI_API_URL, { params: { url } }),
      );

      const odesli = response.data;
      const platforms: SongLinkPlatform[] = Object.entries(odesli.linksByPlatform).map(([platform, link]) => ({
        platform,
        url: link.url,
      }));

      if (!platforms.length) {
        throw new BadRequestException('No links found for this URL');
      }

      const entity = odesli.entitiesByUniqueId[odesli.entityUniqueId];

      return {
        pageUrl: odesli.pageUrl,
        thumbnail: entity?.thumbnailUrl,
        title: entity?.title,
        artist: entity?.artistName,
        platforms,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Songlink API error', error);
      throw new BadRequestException('Songlink API error');
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/songlink/songlink.service.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/songlink/songlink.service.ts src/songlink/songlink.service.spec.ts
git commit -m "feat: add SongLinkService proxying the Odesli API"
```

---

### Task 3: SongLinkController + Module wiring

**Files:**
- Create: `src/songlink/songlink.controller.ts`
- Create: `src/songlink/songlink.module.ts`
- Modify: `src/app.module.ts`
- Test: `src/songlink/songlink.controller.spec.ts`

**Interfaces:**
- Consumes: `SongLinkService.getSongLinks(url: string): Promise<SongLinkData>` (Task 2), `UrlDto` (Task 1).
- Produces: `SongLinkController` with `GET /songlink` returning `SongLinkResponse`; `SongLinkModule` exported for `AppModule`.

- [ ] **Step 1: Write the failing test**

```ts
// src/songlink/songlink.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { SongLinkController } from './songlink.controller';
import { SongLinkService } from './songlink.service';
import type { SongLinkData } from './types';

describe('SongLinkController', () => {
  let controller: SongLinkController;
  let service: { getSongLinks: jest.Mock };

  beforeEach(async () => {
    service = { getSongLinks: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SongLinkController],
      providers: [{ provide: SongLinkService, useValue: service }],
    }).compile();

    controller = module.get<SongLinkController>(SongLinkController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns the songlink data wrapped in a message envelope', async () => {
    const data: SongLinkData = {
      pageUrl: 'https://song.link/s/123',
      platforms: [{ platform: 'spotify', url: 'https://open.spotify.com/track/123' }],
    };
    service.getSongLinks.mockResolvedValue(data);

    const result = await controller.getSongLinks({ url: 'https://open.spotify.com/track/123' });

    expect(service.getSongLinks).toHaveBeenCalledWith('https://open.spotify.com/track/123');
    expect(result).toEqual({ message: 'found', data });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/songlink/songlink.controller.spec.ts`
Expected: FAIL — cannot find module `./songlink.controller`.

- [ ] **Step 3: Write `src/songlink/songlink.controller.ts`**

```ts
import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SongLinkService } from './songlink.service';
import { UrlDto } from './dto/url.dto';
import type { SongLinkResponse } from './types';

@ApiTags('songlink')
@Controller('songlink')
export class SongLinkController {
  constructor(private songLinkService: SongLinkService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get equivalent streaming links across platforms for a share URL' })
  @ApiResponse({ status: 200, description: 'Links found' })
  @ApiResponse({ status: 400, description: 'Could not resolve links for this URL' })
  async getSongLinks(@Query() query: UrlDto): Promise<SongLinkResponse> {
    const data = await this.songLinkService.getSongLinks(query.url);
    return { message: 'found', data };
  }
}
```

- [ ] **Step 4: Write `src/songlink/songlink.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SongLinkController } from './songlink.controller';
import { SongLinkService } from './songlink.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10_000,
      maxRedirects: 5,
    }),
  ],
  controllers: [SongLinkController],
  providers: [SongLinkService],
})
export class SongLinkModule {}
```

- [ ] **Step 5: Wire into `src/app.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SongLinkModule } from './songlink/songlink.module';

@Module({
  imports: [SongLinkModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx jest src/songlink/songlink.controller.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add src/songlink/songlink.controller.ts src/songlink/songlink.module.ts src/songlink/songlink.controller.spec.ts src/app.module.ts
git commit -m "feat: wire up SongLinkController and module"
```

---

### Task 4: Delete the Deezer module

**Files:**
- Delete: `src/deezer/` (entire directory: `deezer.controller.ts`, `deezer.service.ts`, `deezer.module.ts`, `types.ts`, `deezer.controller.spec.ts`, `deezer.service.spec.ts`, `dto/url.dto.ts`, `dto/search.dto.ts`)

**Interfaces:**
- Consumes: none (this task only removes code; Task 3 already confirmed `SongLinkModule` fully replaces `AppModule`'s use of `DeezerModule`).
- Produces: none.

- [ ] **Step 1: Verify nothing outside `src/deezer/` still imports it**

Run: `grep -rn "from '.*deezer" src --include="*.ts" | grep -v "^src/deezer/"`
Expected: no output (only `app.module.ts`'s old import, already removed in Task 3 Step 5).

- [ ] **Step 2: Delete the directory**

```bash
git rm -r src/deezer
```

- [ ] **Step 3: Run the full test suite to confirm nothing else breaks**

Run: `npx jest`
Expected: PASS, only `songlink` and `app.controller` specs remain.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: remove deezer module, superseded by songlink"
```

---

### Task 5: Manual verification against the real Odesli API

**Files:** none (manual verification, no code changes)

- [ ] **Step 1: Start the dev server**

Run: `npm run start:dev`

- [ ] **Step 2: Hit the endpoint with a real share URL**

Run: `curl "http://localhost:3000/songlink?url=https://open.spotify.com/track/7GhIk7Il098yCjg4BQjzvb"`
Expected: JSON with `message: "found"` and a non-empty `data.platforms` array including at least `spotify` and `deezer`.

- [ ] **Step 3: Confirm error handling with an invalid URL**

Run: `curl "http://localhost:3000/songlink?url=not-a-url"`
Expected: HTTP 400 (DTO validation rejects non-URL before it reaches the service).

- [ ] **Step 4: Stop the dev server**
