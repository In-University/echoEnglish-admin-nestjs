import { PaymentGateway } from '../common/enums/payment_gateway.enum';
import { PaymentStatus } from '../common/enums/payment_status.enum';
import { TransactionType } from '../common/enums/transaction_type.enum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({
  collection: 'payments',
  timestamps: true,
})
export class Payment {
  _id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: [true, 'USER_REQUIRED'],
  })
  user: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(TransactionType),
    default: TransactionType.PURCHASE,
  })
  type: TransactionType;

  @Prop({
    type: Number,
    required: [true, 'TOKENS_REQUIRED'],
  })
  tokens: number;

  @Prop({
    type: String,
  })
  description: string;

  @Prop({
    type: Number,
  })
  amount: number;

  @Prop({
    type: Number,
    default: 0,
  })
  discount: number;

  @Prop({
    type: String,
  })
  promoCode: string;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.INITIATED,
  })
  status: PaymentStatus;

  @Prop({
    type: String,
    enum: Object.values(PaymentGateway),
    default: PaymentGateway.STRIPE,
  })
  paymentGateway: PaymentGateway;

  @Prop({
    type: String,
  })
  payUrl: string;

  @Prop({
    type: Date,
  })
  expiredAt: Date;
}

export type PaymentDocument = Payment & Document;
export const paymentSchema = SchemaFactory.createForClass(Payment);
