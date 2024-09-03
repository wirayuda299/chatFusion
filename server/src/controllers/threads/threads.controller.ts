import { Controller, Delete, Get, Post, Put, Query, Req, Body } from '@nestjs/common';
import { Request } from 'express';

import { ThreadsService } from 'src/services/threads/threads.service';

@Controller('api/v1/threads')
export class ThreadsController {
  constructor(private threadService: ThreadsService) { }

  @Get()
  getAllThreads(
    @Query('channelId') channelId: string,
    @Query('serverId') serverId: string
  ) {
    return this.threadService.getAllThreads(channelId, serverId);
  }

  @Post('/create')
  createThread(@Req() req: Request) {
    const { imageAssetId, message, image, name, userId, messageId, channelId } =
      req.body;

    return this.threadService.createThread(
      messageId,
      userId,
      image,
      imageAssetId,
      message,
      channelId,
      name
    );
  }

  @Put('/update')
  updateThread(@Req() req: Request) {
    const { userId, threadId, threadName } = req.body
    return this.threadService.updateThread(threadId, userId, threadName)
  }

  @Delete('/delete')
  deleteThread(
    @Body('threadId') threadId: string,
    @Body('userId') id: string,
    @Body('serverId') serverId: string
  ) {
    return this.threadService.deleteThread(threadId, id, serverId)
  }
}
