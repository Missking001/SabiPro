import { OnModuleInit } from '@nestjs/common';
import { MailService } from './mail.service';
export declare class MailModule implements OnModuleInit {
    private readonly mailService;
    constructor(mailService: MailService);
    onModuleInit(): Promise<void>;
}
