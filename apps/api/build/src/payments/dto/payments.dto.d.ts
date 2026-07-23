export declare class ProviderBankDetailsDto {
    bankCode: string;
    accountNumber: string;
}
export declare class InitiatePaymentDto {
    providerId: string;
    amount: number;
    inquiryId?: string;
}
