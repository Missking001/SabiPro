import { IsInt, IsPositive, IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class ProviderBankDetailsDto {
  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;
}

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
