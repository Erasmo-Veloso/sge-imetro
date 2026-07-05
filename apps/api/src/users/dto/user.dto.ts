import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase().trim())
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsEnum(['STUDENT', 'TEACHER', 'ADMIN'])
  role!: 'STUDENT' | 'TEACHER' | 'ADMIN';

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  externalCode?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEnum(['STUDENT', 'TEACHER', 'ADMIN'])
  role?: 'STUDENT' | 'TEACHER' | 'ADMIN';

  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'])
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  externalCode?: string;
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
}
