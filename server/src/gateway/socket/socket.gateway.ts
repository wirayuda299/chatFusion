import { Server, Socket } from 'socket.io';
import { Logger, OnModuleInit } from '@nestjs/common';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { MessagesService } from 'src/services/messages/messages.service';
import { ThreadsService } from 'src/services/threads/threads.service';
import { MembersService } from 'src/services/members/members.service';

type PayloadTypes = {
  content: string;
  is_read: boolean;
  user_id: string;
  channelId: string;
  serverId: string;
  imageUrl: string;
  imageAssetId: string;
  type: string;
  messageId: string;
  parentMessageId: string;
  threadId: string;
  recipientId: string;
  conversationId: string;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGateway implements OnModuleInit {
  private activeUsers = new Map<string, string>();
  private logger = new Logger(SocketGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private messagesService: MessagesService,
    private threadsService: ThreadsService,
    private memberService: MembersService
  ) { }

  onModuleInit() {
    this.server.on('connection', this.handleConnection.bind(this));
    this.server.on('disconnect', this.handleDisconnect.bind(this));
  }

  private handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.activeUsers.set(userId, userId);
      this.broadcastActiveUsers();
    }
  }

  private handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.activeUsers.delete(userId);
      this.broadcastActiveUsers();
    }
  }

  private broadcastActiveUsers() {
    process.nextTick(() => {
      this.server.emit('set-active-users', Array.from(this.activeUsers.keys()));
    });
  }

  private async handleReplyMessage(payload: PayloadTypes) {
    try {
      if (payload.parentMessageId && payload.threadId) {
        await this.threadsService.replyThreadMessage(
          payload.parentMessageId,
          payload.threadId,
          payload.content,
          payload.user_id,
          payload.imageUrl,
          payload.imageAssetId
        );
      } else {
        await this.messagesService.replyMessage(
          payload.parentMessageId,
          payload.content,
          payload.user_id,
          payload.imageUrl,
          payload.imageAssetId,
          payload.type
        );
      }
    } catch (error) {
      this.logger.error('Error replying to message', error);
    }
  }

  @SubscribeMessage('message')
  async handleMessage(@MessageBody() payload: PayloadTypes) {
    try {
      this.logger.log(payload)
      switch (payload.type) {
        case 'channel':
          await this.messagesService.sendMessage(
            payload.content,
            payload.user_id,
            payload.channelId,
            payload.imageUrl,
            payload.imageAssetId
          );
          const messages = await this.messagesService.getMessageByChannelId(
            payload.channelId,
            payload.serverId
          );
          this.server.emit('set-message', messages);
          break;
        case 'reply':
          await this.handleReplyMessage(payload);
          break;
        case 'thread':
          await this.threadsService.sendThreadMessage(
            payload.content,
            payload.user_id,
            payload.imageUrl,
            payload.imageAssetId,
            payload.threadId
          );

          const threadMessages = await this.threadsService.getThreadMessage(
            payload.threadId,
            payload.serverId
          );
          this.server.emit('set-thread-messages', threadMessages);
          break;
        case 'personal':
          await this.messagesService.sendPersonalMessage(
            payload.content,
            payload.user_id,
            payload.imageUrl,
            payload.imageAssetId,
            payload.recipientId
          );

          const message = await this.messagesService.getPersonalMessage(
            payload.conversationId,
            payload.user_id
          );
          this.server.emit('set-personal-messages', message);
          break;
        default:
          this.logger.warn(`Unknown message type: ${payload.type}`);
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  @SubscribeMessage('get-channel-message')
  async getChannelMessage(
    @MessageBody() payload: { channelId: string; serverId: string }
  ) {
    try {
      const messages = await this.messagesService.getMessageByChannelId(
        payload.channelId,
        payload.serverId
      );
      this.server.emit('set-message', messages);
    } catch (error) {
      this.logger.error('Error getting channel messages', error);
    }
  }

  @SubscribeMessage('thread-messages')
  async handleThread(
    @MessageBody()
    payload: {
      threadId: string;
      serverId: string;
    }
  ) {
    try {
      const messages = await this.threadsService.getThreadMessage(
        payload.threadId,
        payload.serverId
      );
      this.server.emit('set-thread-messages', messages);
    } catch (error) {
      this.logger.error('Error getting thread messages', error);
    }
  }

  @SubscribeMessage('personal-message')
  async getPersonalMessages(
    @MessageBody() payload: { conversationId: string; userId: string }
  ) {
    try {
      const messages = await this.messagesService.getPersonalMessage(
        payload.conversationId,
        payload.userId
      );
      process.nextTick(() => {
        this.server.emit('set-personal-messages', messages);
      });
    } catch (error) {
      this.logger.error('Error getting personal messages', error);
    }
  }

  @SubscribeMessage('banned_members')
  async getBannedMembers(@MessageBody() payload: { serverId: string }) {
    try {
      const bannedMebers = await this.memberService.getBannedMembers(payload.serverId)
      this.server.emit('set-banned-members', bannedMebers.data)
    } catch (error) {
      this.logger.error('Error getting banned members', error.message)
    }
  }
}


