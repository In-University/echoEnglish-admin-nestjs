import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Gender } from '../common/enums/gender.enum';
import { validateDob } from '../common/utils/validation';

export type UserDocument = User & Document;

@Schema({
  collection: 'users',
  timestamps: true,
})
export class User {
  _id: Types.ObjectId;

  @Prop({
    required: [true, 'FULL_NAME_REQUIRED'],
    trim: true,
  })
  fullName: string;

  @Prop({
    type: String,
    enum: Object.values(Gender),
    default: Gender.OTHER,
  })
  gender: Gender;

  @Prop({
    type: Date,
    validate: {
      validator: validateDob,
      message: 'DOB_INVALID',
    },
  })
  dob?: Date;

  @Prop({
    required: [true, 'EMAIL_REQUIRED'],
    unique: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'EMAIL_INVALID'],
  })
  email: string;

  @Prop({
    required: [true, 'PASSWORD_REQUIRED'],
    minlength: [8, 'PASSWORD_INVALID'],
    maxlength: [100, 'PASSWORD_INVALID'],
  })
  password: string;

  @Prop({
    type: String,
    match: [/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, 'PHONE_NUMBER_INVALID'],
  })
  phoneNumber?: string;

  @Prop({ type: String })
  address?: string;

  @Prop({ type: String })
  image?: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Role' }],
    default: [],
  })
  roles: Types.ObjectId[];

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'TOKEN_INVALID'],
  })
  credits: number;

  @Prop({ default: false })
  isDeleted: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add indexes for better query performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ isDeleted: 1 });
UserSchema.index({ roles: 1 });
UserSchema.index({ createdAt: -1 });

// Remove password from toJSON transformation
UserSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  },
});
