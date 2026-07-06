import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class UploadLegacyDto {
  @IsString()
  @IsIn(['CSV', 'SQL'])
  type!: 'CSV' | 'SQL';

  @IsOptional()
  @IsObject()
  mapping?: Record<string, string>;
}
