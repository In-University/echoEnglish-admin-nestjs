import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  collection: 'promo_codes',
  timestamps: true,
})
export class PromoCode {
  _id: Types.ObjectId;

  @Prop({
    type: String,
    required: [true, 'CODE_REQUIRED'],
    unique: true,
    uppercase: true,
    trim: true,
  })
  code: string;

  @Prop({
    type: Number,
    required: [true, 'DISCOUNT_REQUIRED'],
    min: 0,
  })
  discount: number;

  @Prop({
    type: Date,
  })
  expiration: Date;

  @Prop({
    type: Number,
    default: 1,
  })
  usageLimit: number;

  @Prop({
    type: Number,
    default: 0,
  })
  usedCount: number;

  @Prop({
    type: Boolean,
    default: true,
  })
  active: boolean;
}
export type PromoCodeDocument = PromoCode & Document;
export const promoCodeSchema = SchemaFactory.createForClass(PromoCode);
