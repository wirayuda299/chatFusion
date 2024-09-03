import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserService } from './services/user/user.service';
import { DatabaseService } from './services/database/database.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, UserService, DatabaseService],
})
export class AppModule {}
