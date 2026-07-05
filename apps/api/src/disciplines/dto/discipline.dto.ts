import { IsInt, IsOptional, IsString, MaxLength, MinLength, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateDisciplineDto {
  @IsString()
  @MinLength(1)
  courseId!: string;

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
  @Min(0)
  @Max(20)
  credits?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(600)
  workloadHrs?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  semester?: number;
}

export class UpdateDisciplineDto {
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
  @Min(0)
  @Max(20)
  credits?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(600)
  workloadHrs?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  semester?: number;
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

  @IsOptional()
  @IsString()
  courseId?: string;
}
