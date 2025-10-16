import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { NotificationType } from '../common/enums/notification-type.enum';

export type NotificationDocument = Notification & Document;

@Schema({
  collection: 'notifications',
  timestamps: true,
})
export class Notification {
  _id: Types.ObjectId;

  @Prop({
    required: [true, 'Title is required'],
  })
  title: string;

  @Prop({ type: String })
  body?: string;

  @Prop({ type: String })
  deepLink?: string;

  @Prop({
    type: String,
    enum: Object.values(NotificationType),
    default: NotificationType.INFO,
    required: true,
  })
  type: NotificationType;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'User' }],
    default: [],
  })
  userIds: Types.ObjectId[];

  @Prop({
    type: [
      {
        userId: {
          type: Types.ObjectId,
          ref: 'User',
          required: true,
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
        isDeleted: {
          type: Boolean,
          default: false,
        },
      },
    ],
    default: [],
    _id: false,
  })
  readBy: {
    userId: Types.ObjectId;
    readAt: Date;
    isDeleted: boolean;
  }[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
