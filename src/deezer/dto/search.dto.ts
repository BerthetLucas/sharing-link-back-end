import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SearchDto {
  @ApiProperty({ example: 'Daft Punk' })
  @IsString()
  @IsNotEmpty()
  artist: string;

  @ApiProperty({ example: 'Random Access Memories' })
  @IsString()
  @IsNotEmpty()
  album: string;

  @ApiProperty({ example: 'Get Lucky' })
  @IsString()
  @IsNotEmpty()
  track: string;
}
