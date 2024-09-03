import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { MessagesService } from 'src/services/messages/messages.service';

@Controller('api/v1/messages')
export class MessagesController {
  constructor(private messageService: MessagesService) {}

  @Post('pin-message')
  pinMessage(
    @Body('messageId') msgId: string,
    @Body('channelId') channelId: string,
    @Body('pinnedBy') author: string
  ) {
    return this.messageService.pinMessage(msgId, channelId, author);
  }

  @Post('/pin-personal-message')
  pinPersonalMessage(
    @Body('messageId') msgId: string,
    @Body('conversationId') id: string,
    @Body('pinnedBy') author: string
  ) {
    return this.messageService.pinPersonalMessage(msgId, author, id);
  }

  @Get('/pinned-messages')
  getPinnedMessages(
    @Query('channelId') id: string,
    @Query('serverId') serverId: string
  ) {
    return this.messageService.getPinnedMessages(id, serverId);
  }

  @Get('/personal-pinned-messages')
  getPersonalPinnedMessages(@Query('conversationId') id: string) {
    return this.messageService.getPersonalPinnedMessages(id);
  }

  @Get('message-channel')
  getMessageChannelById(
    @Query('channel_id') id: string,
    @Query('server_id') serverId: string
  ) {
    return this.messageService.getMessageByChannelId(id, serverId);
  }

  @Patch('edit-message')
  editMessage(@Req() req: Request) {
    const { messageAuthor, currentUser, messageId, content } = req.body;
    return this.messageService.editMessage(
      messageAuthor,
      currentUser,
      messageId,
      content
    );
  }

  @Delete('/delete-personal-pinned-message')
  deletePersonalPinnedMessage(@Body('messageId') id: string) {
    return this.messageService.deletePersonalPinnedMessage(id);
  }

  @Delete('/delete-channel-pinned-message')
  deleteChannelPinnedMessage(
    @Body('messageId') id: string,
    @Body('channelId') channelId: string
  ) {
    return this.messageService.deleteChannelPinnedMessage(id, channelId);
  }
  @Delete('/delete')
  deleteMessage(@Body('messageId') id: string) {
    return this.messageService.deleteMessage(id);
  }
}
