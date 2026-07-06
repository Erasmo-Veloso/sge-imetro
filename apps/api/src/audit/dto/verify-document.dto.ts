import { IsEnum, IsOptional, IsString } from 'class-validator';

export class VerifyDocumentDto {
  @IsString()
  documentId!: string;

  @IsEnum(['VERIFIED', 'REJECTED'])
  decision!: 'VERIFIED' | 'REJECTED';

  @IsOptional()
  @IsString()
  note?: string;
}
