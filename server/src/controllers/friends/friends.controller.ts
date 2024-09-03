import { Controller, Get, Query } from '@nestjs/common';
import { FriendsService } from '../../services/friends/friends.service';

@Controller('api/v1/friends')
export class FriendsController {
  constructor(private friendService: FriendsService) {}

  @Get()
  getFriendById(@Query('userId') userId: string) {
    return this.friendService.getFriend(userId);
  }
  @Get('/list')
  getFriendList(@Query('userId') id: string) {
    return this.friendService.getFriends(id);
  }
}
