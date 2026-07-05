import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateClassDto {
  @IsUUID()
  disciplineId!: string;

  @IsOptional()
  @IsUUID()
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
