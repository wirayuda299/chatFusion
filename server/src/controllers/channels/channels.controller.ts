import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  Query,
  Put,
  Delete,
} from '@nestjs/common';
import type { Request } from 'express';

import { ChannelsService } from 'src/services/channels/channels.service';

@Controller('/api/v1/channels')
export class ChannelsController {
  constructor(private channelService: ChannelsService) { }

  @Get('/list')
  getAllChannel(@Query('serverId') id: string) {

    return this.channelService.getAllChannelsInServer(id);
  }

  @Get('/:id')
  getChannelById(@Param('id') channelId: string) {
    return this.channelService.getChannelById(channelId);
  }

  @Post('/create')
  createChannel(@Req() req: Request) {
    const { name, server_id, type, userId, serverAuthor } = req.body;

    return this.channelService.createChannel(
      name,
      server_id,
      type,
      userId,
      serverAuthor
    );
  }

  @Put('/update')
  updateChannel(@Req() req: Request) {
    const { name, topic, userId, serverId, serverAuthor, channelId } = req.body
    return this.channelService.updateChannel(serverId, channelId, userId, serverAuthor, name, topic)
  }

  @Delete('/delete')
  deleteChannel(@Req() req: Request) {
    const { serverId, userId, channelId, serverAuthor, type } = req.body
    return this.channelService.deleteChannel(serverId, userId, channelId, serverAuthor, type)
  }
}
