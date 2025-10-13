import { Payment, paymentSchema } from "../../database/payment.schema";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";

@Module({
    imports: [MongooseModule.forFeature([{name: Payment.name, schema: paymentSchema}])],
    controllers: [PaymentController],
    providers: [PaymentService],
})

export class PaymentModule {}