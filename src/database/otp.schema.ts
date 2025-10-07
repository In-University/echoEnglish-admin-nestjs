// src/database/schemas/otp.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { OtpPurpose } from '../common/enums/otp-purpose.enum';

@Schema({ timestamps: true, collection: 'otps' })
export class Otp {
  @Prop({ required: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  otp: string;

  @Prop({ required: true, type: String, enum: Object.values(OtpPurpose) })
  purpose: OtpPurpose;

  @Prop({ required: true })
  expiryTime: Date;
}

export type OtpDocument = Otp & Document;
export const OtpSchema = SchemaFactory.createForClass(Otp);
