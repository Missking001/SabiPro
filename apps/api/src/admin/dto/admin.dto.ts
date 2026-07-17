import { IsString, IsOptional, IsEnum } from 'class-validator';

export class ApproveVettingDto {
  @IsString()
  @IsOptional()
  badgeType?: string;
}

export class ResolveFlagDto {
  @IsString()
  @IsOptional()
  action?: string;
}
