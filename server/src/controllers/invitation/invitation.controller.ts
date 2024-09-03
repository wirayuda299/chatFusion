import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { InvitationService } from 'src/services/invitation/invitation.service';

@Controller('api/v1/invitation')
export class InvitationController {
  constructor(private invitationService: InvitationService) {}

  @Get('/pending-invitation')
  getPendingInvitation(@Query('userId') id: string) {
    return this.invitationService.getPendingInvitation(id);
  }
  @Get('/my-invitation')
  getCurrentUsertInvitation(@Query('userId') id: string) {
    return this.invitationService.getCurrentUserInvitation(id);
  }

  @Post('/invite-user')
  inviteUser(
    @Body('userToInvite') usertoInvite: string,
    @Body('userId') id: string
  ) {
    return this.invitationService.inviteUser(usertoInvite, id);
  }

  @Post('/accept')
  acceptInvitation(
    @Body('userId') id: string,
    @Body('friendId') friendId: string
  ) {
    return this.invitationService.acceptInvitation(id, friendId);
  }
  @Post('/cancel')
  cancelInvitation(@Body('userId') id: string) {
    return this.invitationService.cancelInvitation(id);
  }
}
