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

export class CreateAssessmentItemDto {
  @IsEnum(['FREQUENCY', 'TEST', 'EXAM', 'PROJECT', 'HOMEWORK'])
  type!: 'FREQUENCY' | 'TEST' | 'EXAM' | 'PROJECT' | 'HOMEWORK';

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  weight!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  maxScore!: number;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class CreateAssessmentPlanDto {
  @IsNumber()
  @Min(1)
  @Max(100)
  scaleMax!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  passingScore!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  minAttendancePct!: number;

  @IsEnum(['FLOOR', 'CEIL', 'ROUND', 'NONE'])
  roundingRule!: 'FLOOR' | 'CEIL' | 'ROUND' | 'NONE';

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateAssessmentItemDto)
  items!: CreateAssessmentItemDto[];
}
