import { Module } from '@nestjs/common';
import { DeezerController } from './deezer.controller';
import { DeezerService } from './deezer.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [DeezerController],
  providers: [DeezerService],
})
export class DeezerModule {}
