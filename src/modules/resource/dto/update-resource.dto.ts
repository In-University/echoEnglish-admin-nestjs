import { IsString, IsOptional, IsBoolean, IsUrl } from 'class-validator';

export class UpdateResourceDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsBoolean()
  suitableForLearners?: boolean;
}
