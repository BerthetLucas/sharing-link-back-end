import { Module } from '@nestjs/common';
import { DeezerController } from './deezer.controller';
import { DeezerService } from './deezer.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10_000,
      maxRedirects: 5,
    }),
  ],
  controllers: [DeezerController],
  providers: [DeezerService],
})
export class DeezerModule {}
