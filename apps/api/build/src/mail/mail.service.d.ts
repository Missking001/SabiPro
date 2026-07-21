export declare class MailService {
    private readonly logger;
    private transporter;
    onModuleInit(): Promise<void>;
    sendVerificationEmail(to: string, name: string, token: string): Promise<void>;
    sendPasswordResetEmail(to: string, name: string, token: string): Promise<void>;
    sendLockoutEmail(to: string, name: string): Promise<void>;
}
