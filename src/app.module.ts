import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DeezerModule } from './deezer/deezer.module';

@Module({
  imports: [DeezerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
