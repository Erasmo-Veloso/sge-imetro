import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateRegistrationDto {
  @IsString()
  classId!: string;

  @IsInt()
  @Min(2000)
  academicYear!: number;

  @IsOptional()
  @IsString()
  enrollmentId?: string;
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
  classId?: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
