import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationSocketClient } from './notification-socket.client';
import {
  Notification,
  NotificationSchema,
} from '../../database/notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  providers: [NotificationService, NotificationSocketClient],
  controllers: [NotificationController],
  exports: [NotificationService, NotificationSocketClient],
})
export class NotificationModule {}
