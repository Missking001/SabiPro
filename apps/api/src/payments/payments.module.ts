import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PayoutsController } from './payouts.controller';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [PaymentsController, PayoutsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
