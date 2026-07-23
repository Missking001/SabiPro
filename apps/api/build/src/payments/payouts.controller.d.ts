import { PaymentsService } from './payments.service';
import { ProviderBankDetailsDto } from './dto/payments.dto';
export declare class PayoutsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    submitBankDetails(user: {
        userId: string;
    }, dto: ProviderBankDetailsDto): Promise<{
        message: string;
    }>;
    getBankDetails(user: {
        userId: string;
    }): Promise<{
        bankCode: any;
        accountNumber: any;
    }>;
}
