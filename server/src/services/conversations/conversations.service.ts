import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class ConversationsService {
  constructor(private db: DatabaseService) { }

  async getUserConversations(userId: string) {
    try {
      const conversations = await this.db.pool.query(
        `
      SELECT
        c.created_at AS "conversationCreatedAt",
        c.id AS "conversationId",
        f.id as id,
        CASE
          WHEN f.user_id = $1 THEN f.friend_id
          ELSE f.user_id
        END AS "friendId",
        CASE
          WHEN f.user_id = $1 THEN u_friend.username
          ELSE u_user.username
        END AS "friendUsername",
        CASE
          WHEN f.user_id = $1 THEN u_friend.image
          ELSE u_user.image
        END AS "friendImage",
        CASE
          WHEN f.user_id = $1 THEN u_friend.created_at
          ELSE u_user.created_at
        END AS "friendCreatedAt"
      FROM conversations AS c
      JOIN friends AS f ON (c.sender_id = f.user_id AND c.recipient_id = f.friend_id) OR (c.sender_id = f.friend_id AND c.recipient_id = f.user_id)
      JOIN users AS u_user ON u_user.id = f.user_id
      JOIN users AS u_friend ON u_friend.id = f.friend_id
      WHERE f.user_id = $1 OR f.friend_id = $1
      `,
        [userId]
      );

      return {
        data: conversations.rows,
        error: false,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
