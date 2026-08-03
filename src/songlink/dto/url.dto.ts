import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class UrlDto {
  @ApiProperty({ example: 'https://open.spotify.com/track/...' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url: string;
}
