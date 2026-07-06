import { IsString } from 'class-validator';

export class ProcessPaymentDto {
  @IsString()
  paymentId!: string;

  @IsString()
  phone!: string;

  @IsString()
  pin!: string;
}
