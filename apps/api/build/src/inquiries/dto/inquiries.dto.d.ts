import { InquiryStatus } from '@prisma/client';
export declare class CreateInquiryDto {
    providerId: string;
    message: string;
}
export declare class UpdateInquiryStatusDto {
    status: InquiryStatus;
}
