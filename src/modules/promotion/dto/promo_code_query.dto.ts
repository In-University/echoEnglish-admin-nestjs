// src/modules/promotion/dto/promo-query.dto.ts
import { Transform, Type } from 'class-transformer';
import { IsBooleanString, IsInt, IsNumber, IsNumberString, IsOptional, IsString, Min } from 'class-validator';

export class PromoQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  active?: string; // "true" hoặc "false"

  @Type(() => Number)
  @IsOptional()
  minDiscount?: number;

  @Type(() => Number)
  @IsOptional()
  maxDiscount?: number;

  @IsOptional()
  sort?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  status?: 'expired' | 'valid'; 

  @IsOptional()
  @IsString()
  availability?: 'out' | 'available';
}
