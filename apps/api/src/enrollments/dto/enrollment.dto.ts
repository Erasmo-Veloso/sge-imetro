import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

const STATUSES = ['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'WAITLIST'] as const;

export class CreateEnrollmentDto {
  @IsString()
  selectionProcessId!: string;
}

export class ReviewEnrollmentDto {
  @IsEnum(STATUSES)
  decision!: 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'WAITLIST';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rejectionReason?: string;
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
  @IsEnum(STATUSES)
  status?: 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'WAITLIST';

  @IsOptional()
  @IsString()
  selectionProcessId?: string;
}
