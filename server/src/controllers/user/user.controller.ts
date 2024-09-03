import {
  Controller,
  Delete,
  Get,
  Put,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from '../../services/user/user.service';

@Controller('/api/v1/user')
export class UserController {
  constructor(private userService: UserService) { }


  @Put('/update')
  updateUser(@Req() req: Request) {
    const { name, id, bio, image, imageAssetId } = req.body;
    return this.userService.updateUser(name, id, bio, image, imageAssetId);
  }

  @Post('/create')
  async createUser(@Req() req: Request) {
    const { id, username, email, image } = req.body;

    return this.userService.createUser(id, username, email, image);
  }

  @Get('/find')
  searchUser(@Query('name') name: string, @Query('id') id: string) {
    return this.userService.searchUser(name, id);
  }

  @Get('/find-all')
  listAllUsers(@Query('userId') userId: string) {
    return this.userService.findAllUser(userId);
  }

  @Get('/:id')
  getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Delete('/delete')
  deleteUser(@Req() req: Request) {
    const { id } = req.body;
    return this.userService.deleteUser(id);
  }
}
