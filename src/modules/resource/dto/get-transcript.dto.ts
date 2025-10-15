import { IsString, IsUrl, IsNotEmpty } from 'class-validator';

export class GetTranscriptDto {
  @IsNotEmpty()
  @IsString()
  @IsUrl()
  url: string;
}
