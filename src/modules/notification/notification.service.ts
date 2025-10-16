import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from '../../database/notification.schema';
import { PushNotificationDto } from './dto/push-notification.dto';
import { NotificationSocketClient } from './notification-socket.client';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private notificationSocketClient: NotificationSocketClient,
  ) {}

  async pushNotification(
    userId: string,
    payload: PushNotificationDto,
  ): Promise<Notification> {
    const userIds = payload.userIds?.map((id) => new Types.ObjectId(id)) || [];

    const notification = await this.notificationModel.create({
      title: payload.title,
      body: payload.body,
      deepLink: payload.deepLink,
      type: payload.type,
      userIds: userIds,
      createdBy: new Types.ObjectId(userId),
      readBy: [],
    });

    // Emit real-time notification via Socket.IO
    const notificationPayload = {
      _id: notification._id.toString(),
      title: notification.title,
      body: notification.body,
      deepLink: notification.deepLink,
      type: notification.type,
      createdAt: notification.createdAt,
      createdBy: notification.createdBy.toString(),
      isRead: false,
    };

    if (userIds.length > 0) {
      // Send to specific users
      this.notificationSocketClient.emitToUsers(
        userIds.map((id) => id.toString()),
        'notifications',
        notificationPayload,
      );
    } else {
      // Broadcast to all users
      this.notificationSocketClient.emitToAll(
        'notifications',
        notificationPayload,
      );
    }

    return notification;
  }

  async getAllUserNotifications(userId: string): Promise<any[]> {
    if (!userId) {
      throw new NotFoundException('User ID is required');
    }

    const userObjectId = new Types.ObjectId(userId);
    const query = {
      $or: [{ userIds: { $size: 0 } }, { userIds: userObjectId }],
    };

    const data = await this.notificationModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();

    const notifications = data
      .map((n) => {
        const readEntry = n.readBy.find(
          (r) => r.userId.toString() === userId && !r.isDeleted,
        );

        if (readEntry?.isDeleted) {
          return null;
        }

        return {
          _id: n._id.toString(),
          title: n.title,
          body: n.body,
          deepLink: n.deepLink,
          type: n.type,
          createdAt: n.createdAt,
          createdBy: n.createdBy,
          isRead: !!readEntry,
        };
      })
      .filter(Boolean);

    return notifications;
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const notification = await this.notificationModel.findById(notificationId);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const existingEntry = notification.readBy.find(
      (r) => r.userId.toString() === userId,
    );

    if (existingEntry) {
      await this.notificationModel.updateOne(
        { _id: notificationId, 'readBy.userId': userId },
        { $set: { 'readBy.$.readAt': new Date() } },
      );
    } else {
      await this.notificationModel.updateOne(
        { _id: notificationId },
        {
          $push: {
            readBy: {
              userId: new Types.ObjectId(userId),
              readAt: new Date(),
              isDeleted: false,
            },
          },
        },
      );
    }

    // Emit real-time event for notification read
    this.notificationSocketClient.emitToUser(userId, 'notifications_read', {
      notificationId,
      readAt: new Date(),
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const userObjectId = new Types.ObjectId(userId);
    const notifications = await this.notificationModel
      .find({
        $or: [{ userIds: { $size: 0 } }, { userIds: userObjectId }],
      })
      .exec();

    for (const notification of notifications) {
      const existingEntry = notification.readBy.find(
        (r) => r.userId.toString() === userId,
      );

      if (!existingEntry) {
        await this.notificationModel.updateOne(
          { _id: notification._id },
          {
            $push: {
              readBy: {
                userId: userObjectId,
                readAt: new Date(),
                isDeleted: false,
              },
            },
          },
        );
      }
    }

    // Emit real-time event for all notifications read
    this.notificationSocketClient.emitToUser(userId, 'notifications_read_all', {
      readAt: new Date(),
    });
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const userObjectId = new Types.ObjectId(userId);
    const notifications = await this.notificationModel
      .find({
        $or: [{ userIds: { $size: 0 } }, { userIds: userObjectId }],
      })
      .exec();

    const unreadCount = notifications.filter((n) => {
      const readEntry = n.readBy.find((r) => r.userId.toString() === userId);
      return !readEntry || readEntry.isDeleted;
    }).length;

    return { count: unreadCount };
  }

  async softDeleteNotification(
    userId: string,
    notificationId: string,
  ): Promise<void> {
    if (!userId || !notificationId) {
      throw new NotFoundException('User ID and Notification ID are required');
    }

    const notification = await this.notificationModel.findById(notificationId);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const existingEntry = notification.readBy.find(
      (r) => r.userId.toString() === userId,
    );

    if (existingEntry) {
      await this.notificationModel.updateOne(
        { _id: notificationId, 'readBy.userId': userId },
        { $set: { 'readBy.$.isDeleted': true } },
      );
    } else {
      await this.notificationModel.updateOne(
        { _id: notificationId },
        {
          $push: {
            readBy: {
              userId: new Types.ObjectId(userId),
              readAt: new Date(),
              isDeleted: true,
            },
          },
        },
      );
    }

    // Emit real-time event for notification deleted
    this.notificationSocketClient.emitToUser(userId, 'notifications_deleted', {
      notificationId,
      deletedAt: new Date(),
    });
  }
}
