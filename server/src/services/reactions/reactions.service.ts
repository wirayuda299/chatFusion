import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class ReactionsService {
  constructor(private db: DatabaseService) { }

  async addOrRemoveReactions(
    message_id: string,
    emoji: string,
    unified_emoji: string,
    react_by: string
  ) {
    try {
      const existingReaction = await this.db.pool.query(
        `select * from reactions as r
        where r.react_by= $1 and r.unified_emoji = $2 and r.message_id = $3`,
        [react_by, unified_emoji, message_id]
      );

      if (existingReaction.rows.length >= 1) {
        await this.db.pool.query(
          `delete from reactions
           where react_by = $1 and unified_emoji = $2
        `,
          [react_by, unified_emoji]
        );
      } else {
        await this.db.pool.query(
          `insert into reactions(message_id, emoji, unified_emoji, react_by)
           values($1, $2, $3, $4)`,
          [message_id, emoji, unified_emoji, react_by]
        );
      }

      return {
        message: 'added',
        error: false,
      };
    } catch (error) {
      throw error;
    }
  }

  async getReactions(messageId: string) {
    try {
      const reactions = await this.db.pool.query(
        `SELECT * FROM reactions WHERE message_id = $1`,
        [messageId]
      );
      return reactions.rows;
    } catch (error) {
      throw error;
    }
  }
}
