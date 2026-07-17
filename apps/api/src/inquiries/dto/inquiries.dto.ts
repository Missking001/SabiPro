import { IsString, IsNotEmpty, IsEnum, MaxLength } from 'class-validator';
import { InquiryStatus } from '@prisma/client';

export class CreateInquiryDto {
  @IsString()
  @IsNotEmpty()
  providerId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;
}

export class UpdateInquiryStatusDto {
  @IsEnum(InquiryStatus)
  @IsNotEmpty()
  status: InquiryStatus;
}
