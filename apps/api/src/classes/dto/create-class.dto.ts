import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateClassDto {
  @IsString()
  @MinLength(1)
  disciplineId!: string;

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsInt()
  @Min(2020)
  year!: number;

  @IsOptional()
  @IsString()
  period?: 'FIRST' | 'SECOND';

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  schedule?: string;

  @IsOptional()
  @IsString()
  room?: string;
}
