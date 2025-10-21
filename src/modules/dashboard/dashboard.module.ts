import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { UserSchema } from '../../database/user.schema';
import { paymentSchema } from '../../database/payment.schema';
import { ResourceSchema } from '../../database/resource.schema';
import { testResultSchema } from '../../database/testResult.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Payment', schema: paymentSchema },
      { name: 'Resource', schema: ResourceSchema },
      { name: 'TestResult', schema: testResultSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}