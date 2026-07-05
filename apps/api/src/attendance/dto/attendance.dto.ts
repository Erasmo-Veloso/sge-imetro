import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  note?: string;
}

export class VerifyQrDto {
  @IsString()
  qrToken!: string;
}

export class RecordAttendanceDto {
  @IsString()
  registrationId!: string;

  @IsEnum(['PRESENT', 'ABSENT', 'JUSTIFIED', 'LATE'])
  status!: 'PRESENT' | 'ABSENT' | 'JUSTIFIED' | 'LATE';
}

export class UpdateAttendanceDto {
  @IsEnum(['PRESENT', 'ABSENT', 'JUSTIFIED', 'LATE'])
  status!: 'PRESENT' | 'ABSENT' | 'JUSTIFIED' | 'LATE';

  @IsOptional()
  @IsString()
  note?: string;
}
