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
