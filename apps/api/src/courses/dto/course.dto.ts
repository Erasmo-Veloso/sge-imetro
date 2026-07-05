import { IsInt, IsOptional, IsString, MaxLength, MinLength, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCourseDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  durationYears?: number;

  @IsOptional()
  @IsString()
  coordinatorId?: string;
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  durationYears?: number;

  @IsOptional()
  @IsString()
  coordinatorId?: string;

  @IsOptional()
  @IsString()
  status?: 'ACTIVE' | 'ARCHIVED';
}

export class PaginationDto {
  @IsOptional()
  @Transform(({ value }: { value: string }) => Number(value) || 1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }: { value: string }) => Number(value) || 20)
  pageSize?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;
}
