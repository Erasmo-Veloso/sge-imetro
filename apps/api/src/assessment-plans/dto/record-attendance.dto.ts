import { IsEnum, IsOptional, IsString } from 'class-validator';

export class RecordAttendanceDto {
  @IsEnum(['PRESENT', 'ABSENT', 'JUSTIFIED', 'LATE'])
  status!: 'PRESENT' | 'ABSENT' | 'JUSTIFIED' | 'LATE';

  @IsOptional()
  @IsString()
  note?: string;
}
