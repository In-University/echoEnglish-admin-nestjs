import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PushNotificationDto } from './dto/push-notification.dto';
import { Response } from '../../common/interfaces/response.interface';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // POST /notifications - Push notification (Admin only)
  @Post()
  async pushNotification(
    @Request() req,
    @Body() pushNotificationDto: PushNotificationDto,
  ): Promise<Response<any>> {
    const userId = req.user.userId;
    const result = await this.notificationService.pushNotification(
      userId,
      pushNotificationDto,
    );

    const message =
      !pushNotificationDto.userIds || pushNotificationDto.userIds.length === 0
        ? 'Broadcast notification sent successfully'
        : 'Notification sent successfully';

    return {
      message,
      data: result,
    };
  }

  // GET /notifications - Get all notifications for user
  @Get()
  async getAllNotificationsForUser(@Request() req): Promise<Response<any>> {
    const userId = req.user.userId;

    const result =
      await this.notificationService.getAllUserNotifications(userId);

    return {
      message: 'Notifications fetched successfully',
      data: result,
    };
  }

  // GET /notifications/unread-count - Get unread count
  @Get('unread-count')
  async getUnreadCount(@Request() req): Promise<Response<any>> {
    const userId = req.user.userId;
    const result = await this.notificationService.getUnreadCount(userId);
    return {
      message: 'Unread count fetched successfully',
      data: result,
    };
  }

  // PUT /notifications/read/all - Mark all as read
  @Put('read/all')
  async markAllAsRead(@Request() req): Promise<Response<void>> {
    const userId = req.user.userId;
    await this.notificationService.markAllAsRead(userId);
    return {
      message: 'All notifications marked as read',
    };
  }

  // PUT /notifications/read/:id - Mark as read
  @Put('read/:id')
  async markAsRead(
    @Request() req,
    @Param('id') notificationId: string,
  ): Promise<Response<void>> {
    const userId = req.user.userId;
    await this.notificationService.markAsRead(userId, notificationId);
    return {
      message: 'Notification marked as read',
    };
  }

  // DELETE /notifications/:id - Soft delete notification
  @Delete(':id')
  async softDeleteNotification(
    @Request() req,
    @Param('id') notificationId: string,
  ): Promise<Response<void>> {
    const userId = req.user.userId;
    await this.notificationService.softDeleteNotification(
      userId,
      notificationId,
    );
    return {
      message: 'Notification deleted successfully',
    };
  }
}
