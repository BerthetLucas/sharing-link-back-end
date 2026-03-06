import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class UrlDto {
  @ApiProperty({ example: 'https://deezer.page.link/...' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url: string;
}
