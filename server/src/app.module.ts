import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { FriendsController } from './controllers/friends/friends.controller';
import { UserController } from './controllers/user/user.controller';
import { ChannelsController } from './controllers/channels/channels.controller';
import { FileUploadController } from './controllers/file-upload/file-upload.controller';
import { ServersController } from './controllers/servers/servers.controller';
import { SocketGateway } from './gateway/socket/socket.gateway';
import { ChannelsService } from './services/channels/channels.service';
import { FriendsService } from './services/friends/friends.service';
import { ServersService } from './services/servers/servers.service';
import { UserService } from './services/user/user.service';
import { ValidationService } from './services/validation/validation.service';
import { MessagesService } from './services/messages/messages.service';
import { MessagesController } from './controllers/messages/messages.controller';
import { InvitationService } from './services/invitation/invitation.service';
import { InvitationController } from './controllers/invitation/invitation.controller';
import { DatabaseService } from './services/database/database.service';
import { ReactionsService } from './services/reactions/reactions.service';
import { ReactionsController } from './controllers/reactions/reactions.controller';
import { ThreadsService } from './services/threads/threads.service';
import { ThreadsController } from './controllers/threads/threads.controller';
import { ImagehandlerService } from './services/imagehandler/imagehandler.service';
import { ConversationsService } from './services/conversations/conversations.service';
import { ConversationsController } from './controllers/conversations/conversations.controller';
import { MembersService } from './services/members/members.service';
import { MembersController } from './controllers/members/members.controller';
import { RolesService } from './services/roles/roles.service';
import { RolesController } from './controllers/roles/roles.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [
    UserController,
    FriendsController,
    FileUploadController,
    ServersController,
    ChannelsController,
    MessagesController,
    InvitationController,
    ReactionsController,
    ThreadsController,
    ConversationsController,
    MembersController,
    RolesController,
  ],
  providers: [
    DatabaseService,
    UserService,
    ValidationService,
    FriendsService,
    SocketGateway,
    ServersService,
    ChannelsService,
    MessagesService,
    InvitationService,
    ReactionsService,
    ThreadsService,
    ImagehandlerService,
    ConversationsService,
    MembersService,
    RolesService,
  ],
})
export class AppModule {

}
