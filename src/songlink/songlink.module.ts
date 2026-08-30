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
