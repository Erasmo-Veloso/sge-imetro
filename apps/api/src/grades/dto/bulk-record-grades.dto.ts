import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class GradeEntryDto {
  @IsString()
  registrationId!: string;

  @IsString()
  assessmentItemId!: string;

  @IsNumber()
  @Min(0)
  @Max(20)
  score!: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class BulkRecordGradesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GradeEntryDto)
  grades!: GradeEntryDto[];
}
