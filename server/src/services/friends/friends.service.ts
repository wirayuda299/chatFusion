import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class FriendsService {
  constructor(private db: DatabaseService) {}

  async getFriends(userId: string) {
    try {
      const friends = await this.db.pool.query(
        `SELECT
          f.id as id,
          u.id as user_id,
          u.username as username,
          u.image as image,
          u.created_at as created_at
          FROM friends as f
          join users as u on f.friend_id = u.id
          WHERE user_id = $1
          UNION
          SELECT
          f.id as id,
          u.id as user_id,
          u.username as username,
          u.image as image,
          u.created_at as created_at
          FROM friends as f
            join users as u on f.user_id = u.id
          WHERE friend_id = $1;`,
        [userId]
      );
      return {
        data: friends.rows,
        error: false,
      };
    } catch (error) {
      throw error;
    }
  }

  async getFriend(userId: string) {
    try {
      const friendUserId = await this.db.pool.query(
        `
      select
        f.id as id,
        u.id as user_id,
        u.username as username,
        u.image as image,
        u.created_at as created_at
        FROM friends as f
        join users as u on f.user_id = u.id
        where user_id = $1`,
        [userId]
      );

      const friendFriendId = await this.db.pool.query(
        `
       select
       f.id as id,
       u.id as user_id,
       u.username as username,
       u.image as image,
       u.created_at as created_at
       FROM friends as f
      join users as u on f.friend_id = u.id
      where friend_id = $1`,
        [userId]
      );

      if (friendFriendId.rows.length < 1 && friendUserId.rows.length < 1) {
        throw new HttpException('Friends not found', HttpStatus.NOT_FOUND);
      }

      return {
        data:
          friendUserId.rows.length >= 1
            ? friendUserId.rows[0]
            : friendFriendId.rows[0],
        error: false,
      };
    } catch (error) {
      throw error;
    }
  }
}
