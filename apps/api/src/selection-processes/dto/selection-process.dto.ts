import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const PERIODS = ['FIRST', 'SECOND'] as const;
const STATUSES = ['DRAFT', 'OPEN', 'CLOSED', 'CANCELLED'] as const;

export class CreateSelectionProcessDto {
  @IsString()
  courseId!: string;

  @IsInt()
  @Min(2000)
  academicYear!: number;

  @IsEnum(PERIODS)
  period!: 'FIRST' | 'SECOND';

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsDateString()
  openDate!: string;

  @IsDateString()
  closeDate!: string;

  @IsInt()
  @Min(0)
  vacancies!: number;
}

export class UpdateSelectionProcessDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  openDate?: string;

  @IsOptional()
  @IsDateString()
  closeDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  vacancies?: number;

  @IsOptional()
  @IsEnum(STATUSES)
  status?: 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED';
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
