import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { io, Socket } from 'socket.io-client';

/**
 * NotificationSocketClient - Socket.IO Client to connect to NodeJS Socket Server
 * Connects to the existing NodeJS Express Socket.IO server instead of creating a new gateway
 * This allows sharing the same WebSocket server across multiple applications
 */
@Injectable()
export class NotificationSocketClient implements OnModuleInit {
  private socket: Socket;
  private readonly logger = new Logger(NotificationSocketClient.name);
  private readonly socketUrl: string;

  constructor(private configService: ConfigService) {
    // Get NodeJS server URL from environment or use default
    this.socketUrl =
      this.configService.get<string>('NODEJS_SOCKET_URL') ||
      'http://localhost:8099';
  }

  /**
   * Initialize Socket.IO client connection on module initialization
   */
  onModuleInit() {
    this.logger.log(
      `Connecting to NodeJS Socket.IO server at ${this.socketUrl}`,
    );

    this.socket = io(this.socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.logger.log(
        `Connected to NodeJS Socket.IO server (ID: ${this.socket.id})`,
      );
    });

    this.socket.on('disconnect', (reason) => {
      this.logger.warn(`Disconnected from NodeJS Socket.IO server: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      this.logger.error(`Connection error: ${error.message}`);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      this.logger.log(
        `Reconnected to NodeJS Socket.IO server (attempt ${attemptNumber})`,
      );
    });
  }

  /**
   * Emit event to a specific user (room)
   * The NodeJS server should have logic to handle room-based emissions
   * @param userId - User ID (room name)
   * @param event - Event name
   * @param payload - Event payload
   */
  emitToUser<T>(userId: string, event: string, payload: T): void {
    if (!this.socket || !this.socket.connected) {
      this.logger.warn('Socket not connected, cannot emit event');
      return;
    }

    // Emit to NodeJS server with user-specific targeting
    // The NodeJS server will handle routing to the correct user room
    this.socket.emit('admin_emit_to_user', {
      userId,
      event,
      payload,
    });

    this.logger.debug(`Emitted ${event} to user ${userId} via NodeJS server`);
  }

  /**
   * Emit event to multiple users (rooms)
   * @param userIds - Array of user IDs
   * @param event - Event name
   * @param payload - Event payload
   */
  emitToUsers<T>(userIds: string[], event: string, payload: T): void {
    if (!this.socket || !this.socket.connected) {
      this.logger.warn('Socket not connected, cannot emit event');
      return;
    }

    // Emit to NodeJS server with multiple users targeting
    this.socket.emit('admin_emit_to_users', {
      userIds,
      event,
      payload,
    });

    this.logger.debug(
      `Emitted ${event} to ${userIds.length} users via NodeJS server`,
    );
  }

  /**
   * Emit event to all connected clients (broadcast)
   * @param event - Event name
   * @param payload - Event payload
   */
  emitToAll<T>(event: string, payload: T): void {
    if (!this.socket || !this.socket.connected) {
      this.logger.warn('Socket not connected, cannot emit event');
      return;
    }

    // Emit to NodeJS server for broadcasting
    this.socket.emit('admin_emit_to_all', {
      event,
      payload,
    });

    this.logger.debug(`Broadcasted ${event} to all clients via NodeJS server`);
  }

  /**
   * Get socket connection status
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Manually reconnect if disconnected
   */
  reconnect(): void {
    if (!this.socket.connected) {
      this.logger.log('Manually reconnecting to NodeJS Socket.IO server');
      this.socket.connect();
    }
  }
}
