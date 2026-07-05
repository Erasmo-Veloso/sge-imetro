import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

class UpdateAssessmentItemDto {
  @IsOptional()
  @IsEnum(['FREQUENCY', 'TEST', 'EXAM', 'PROJECT', 'HOMEWORK'])
  type?: 'FREQUENCY' | 'TEST' | 'EXAM' | 'PROJECT' | 'HOMEWORK';

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxScore?: number;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class UpdateAssessmentPlanDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  scaleMax?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minAttendancePct?: number;

  @IsOptional()
  @IsEnum(['FLOOR', 'CEIL', 'ROUND', 'NONE'])
  roundingRule?: 'FLOOR' | 'CEIL' | 'ROUND' | 'NONE';

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateAssessmentItemDto)
  items?: UpdateAssessmentItemDto[];
}
