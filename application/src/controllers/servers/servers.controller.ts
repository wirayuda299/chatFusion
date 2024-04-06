import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ServersService } from 'src/services/servers/servers.service';

@Controller('/api/v1/servers')
export class ServersController {
  constructor(private serverService: ServersService) {}

  @Post('/create')
  createServer(
    @Body('name') name: string,
    @Body('logo') logo: string,
    @Body('ownerId') owner: string,
    @Body('logoAssetId') logoAssetId: string,
  ) {
    return this.serverService.createServer(name, logo, owner, logoAssetId);
  }

  @Get('all-servers')
  getAllServerCreatedByCurrentUser(@Query('userId') ownerId: string) {
    if (!ownerId) {
      throw new HttpException('User Id is required', HttpStatus.BAD_REQUEST);
    }
    return this.serverService.getAllServerCreatedByCurrentUserOrAsMember(
      ownerId,
    );
  }
  @Get('/members')
  getMembers(@Query('serverId') id: string) {
    return this.serverService.getMemberInServer(id);
  }
  @Delete('/delete')
  deleteServer(
    @Body('serverId') serverId: string,
    @Body('currentSessionId') sessionId: string,
  ) {
    return this.serverService.deleteServer(serverId, sessionId);
  }
  @Get('/:id')
  getServerById(@Param('id') serverId: string) {
    return this.serverService.getServerById(serverId);
  }

  @Patch('/new-invite-code')
  @HttpCode(201)
  generateNewInviteCode(@Body('serverId') id: string) {
    return this.serverService.updateServerCode(id);
  }

  @Patch('/update')
  updateServer(@Req() req: Request) {
    const { serverId, currentSessionId, name, logo, logoAssetId } = req.body;
    return this.serverService.updateServer(
      serverId,
      currentSessionId,
      name,
      logo,
      logoAssetId,
    );
  }

  @Post('/invite-user')
  inviteUser(@Req() req: Request) {
    const { inviteCode, userId, server_id } = req.body;

    return this.serverService.inviteUser(inviteCode, userId, server_id);
  }
}
