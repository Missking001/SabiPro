import { IsInt, IsPositive, IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class InitiatePaymentDto {
  @IsString()
  @IsNotEmpty()
  providerId: string;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsString()
  @IsOptional()
  inquiryId?: string;
}
