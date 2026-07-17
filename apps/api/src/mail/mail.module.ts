import { Global, Module, OnModuleInit } from '@nestjs/common';
import { MailService } from './mail.service';

@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule implements OnModuleInit {
  constructor(private readonly mailService: MailService) {}
  async onModuleInit() {
    await this.mailService.onModuleInit();
  }
}
