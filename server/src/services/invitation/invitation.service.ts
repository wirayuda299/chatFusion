import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { FriendsService } from '../friends/friends.service';

@Injectable()
export class InvitationService {
  constructor(
    private db: DatabaseService,
    private friendService: FriendsService
  ) {}

  async inviteUser(userToInvite: string, userId: string) {
    try {
      if (!userId || !userToInvite) {
        throw new BadRequestException('User id is missing');
      }

      const friend = await this.friendService.getFriends(userId);
      if (friend.data.length >= 1) {
        throw new HttpException('You already a friend', HttpStatus.BAD_REQUEST);
      }

      await this.db.pool.query(
        `insert into invitations (user_to_invite, invitator, status)
         values($1, $2, 'pending')`,
        [userToInvite, userId]
      );

      return {
        messages: 'Invitiation sended',
        error: false,
      };
    } catch (error) {
      throw error;
    }
  }

  async getPendingInvitation(userId: string) {
    try {
      if (!userId) {
        throw new HttpException('User id is missing', HttpStatus.BAD_REQUEST);
      }
      const pendingInvitation = await this.db.pool.query(
        `
        select * from invitations as i
        join users as u on i.user_to_invite  = u.id 
        where i.invitator = $1 and i.status = $2`,
        [userId, 'pending']
      );

      return {
        data: pendingInvitation.rows,
        error: false,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getCurrentUserInvitation(userId: string) {
    try {
      if (!userId) {
        throw new HttpException('User id is missing', HttpStatus.BAD_REQUEST);
      }

      const pendingInvitation = await this.db.pool.query(
        `
         select * from invitations as i
         join users as u on i.invitator  = u.id 
         where i.user_to_invite = $1 and i.status = 'pending'`,
        [userId]
      );
      return {
        data: pendingInvitation.rows,
        error: false,
      };
    } catch (error) {
      throw error;
    }
  }

  async acceptInvitation(userId: string, friend_id: string) {
    try {
      if (!userId || !friend_id) {
        throw new HttpException(
          'User or friend id is missing',
          HttpStatus.BAD_REQUEST
        );
      }
      await this.db.pool.query(`begin`);
      await this.db.pool.query(
        `
          delete from invitations 
          where invitator = $1 and user_to_invite = $2`,
        [friend_id, userId]
      );

      await this.db.pool.query(
        `
          insert into friends(friend_id, user_id)
          values($1, $2)`,
        [friend_id, userId]
      );
      await this.db.pool.query(`commit`);
      return {
        data: 'Now you are friend',
        error: false,
      };
    } catch (error) {
      await this.db.pool.query(`rollback`);
      throw error;
    }
  }

  async cancelInvitation(userId: string) {
    try {
      if (!userId) {
        throw new HttpException('User id is missing', HttpStatus.BAD_REQUEST);
      }
      await this.db.pool.query(
        `delete from invitations as i
        where i.invitator = $1 and status = $2`,
        [userId, 'pending']
      );
      return {
        message: 'Invitation canceled',
        error: false,
      };
    } catch (error) {
      console.log(error);

      throw error;
    }
  }
}
