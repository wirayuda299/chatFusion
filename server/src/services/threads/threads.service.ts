import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { groupReactionsByEmoji } from 'src/common/utils/groupMessageByEmoji';
import { ReactionsService } from '../reactions/reactions.service';
import { MessagesService } from '../messages/messages.service';
import { ImagehandlerService } from '../imagehandler/imagehandler.service';

@Injectable()
export class ThreadsService {
  constructor(
    private db: DatabaseService,
    private reactionService: ReactionsService,
    private messageService: MessagesService,
    private attachementService: ImagehandlerService
  ) { }

  async sendThreadMessage(
    message: string,
    user_id: string,
    imageUrl: string,
    imageAssetId: string,
    threadId: string
  ) {
    try {
      const {
        rows: [threadMessage],
      } = await this.db.pool.query(
        `insert into messages ("content", user_id, "type", image_url, image_asset_id)
         VALUES($1, $2, $3, $4,$5)
         returning id;`,
        [message, user_id, 'threads', imageUrl, imageAssetId]
      );
      await this.db.pool.query(
        `insert into thread_messages (message_id, thread_id)
         VALUES($1, $2)`,
        [threadMessage.id, threadId]
      );
    } catch (error) {
      throw error;
    }
  }
  async isAllowedToManageThread(serverId: string, userId: string) {
    const isallowed = await this.db.pool.query(
      `SELECT p.manage_channel
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN user_roles ur ON rp.role_id = ur.role_id
        JOIN members m ON ur.user_id = m.user_id
        WHERE m.user_id = $1
        AND m.server_id = $2
        AND p.manage_thread = true`,
      [serverId, userId]
    );
    return isallowed.rows;
  }
  async createThread(
    message_id: string,
    user_id: string,
    imageUrl: string = '',
    imageAssetId: string = '',
    message: string,
    channelId: string,
    name: string = ''
  ) {
    try {
      await this.db.pool.query('begin');
      const {
        rows: [thread],
      } = await this.db.pool.query(
        `insert into threads (message_id, author, name, channel_id)
        values($1,$2,$3, $4)
        returning id
        `,
        [message_id, user_id, name, channelId]
      );

      await this.sendThreadMessage(
        message,
        user_id,
        imageUrl,
        imageAssetId,
        thread.id
      );

      await this.db.pool.query('commit');

      return {
        message: 'Threads has been created',
        error: false,
      };
    } catch (error) {
      await this.db.pool.query('rollback');
      throw error;
    }
  }

  async getReplies(
    message: any,
    serverId: string,
    messagesWithReactions: any[]
  ) {
    const reactions = await this.reactionService.getReactions(
      message.message_id
    );
    const threads = await this.messageService.getThreadByMessage(
      message.message_id,
      serverId
    );

    message.threads = threads || [];
    message.reactions = reactions;

    messagesWithReactions.push(message);

    const replies = await this.db.pool.query(
      `
        SELECT
        sp.username AS username,
        tmr.parent_message_id AS parent_message_id,
        m."content" AS message,
        m.is_read AS is_read,
        m.id AS message_id,
        m.user_id AS author,
        m.image_url AS media_image,
        m."type" AS message_type,
        m.image_asset_id AS media_image_asset_id,
        m.created_at AS created_at,
        m.updated_at AS update_at
        FROM thread_messages_replies AS tmr
        JOIN messages AS m ON m.id = tmr.message_id
        JOIN server_profile AS sp ON sp.user_id = m.user_id AND sp.server_id = $1
        WHERE tmr.parent_message_id = $2
      `,
      [serverId, message.message_id]
    );

    for (const reply of replies.rows) {
      await this.getReplies(reply, serverId, messagesWithReactions);
    }
  };

  async getThreadMessage(threadId: string, serverId: string) {
    try {
      const messagesWithReactions = [];

      const messages = await this.db.pool.query(
        `
      SELECT
      tm.message_id AS message_id,
      m."content" AS message,
      m.is_read AS is_read,
      m.user_id AS author,
      m.image_url AS media_image,
      m."type" AS message_type,
      m.image_asset_id AS media_image_asset_id,
      m.created_at AS created_at,
      m.updated_at AS update_at,
      sp.username AS username
      FROM thread_messages AS tm
      JOIN messages AS m ON tm.message_id = m.id
      JOIN server_profile AS sp ON sp.user_id = m.user_id AND sp.server_id = $1
      WHERE tm.thread_id = $2 AND m.type = 'threads'
      ORDER BY m.created_at ASC
    `,
        [serverId, threadId]
      );

      const processMessage = async (message) => {
        const reactions = await this.reactionService.getReactions(
          message.message_id
        );
        const threads = await this.messageService.getThreadByMessage(
          message.message_id,
          serverId
        );

        message.threads = threads || [];
        message.reactions = reactions;

        messagesWithReactions.push(message);

        const replies = await this.db.pool.query(
          `
        SELECT
        sp.username AS username,
        tmr.parent_message_id AS parent_message_id,
        m."content" AS message,
        m.is_read AS is_read,
        m.id AS message_id,
        m.user_id AS author,
        m.image_url AS media_image,
        m."type" AS message_type,
        m.image_asset_id AS media_image_asset_id,
        m.created_at AS created_at,
        m.updated_at AS update_at
        FROM thread_messages_replies AS tmr
        JOIN messages AS m ON m.id = tmr.message_id
        JOIN server_profile AS sp ON sp.user_id = m.user_id AND sp.server_id = $1
        WHERE tmr.parent_message_id = $2
      `,
          [serverId, message.message_id]
        );

        for (const reply of replies.rows) {
          await processMessage(reply);
        }
      };

      for await (const message of messages.rows) {
        await processMessage(message);
      }

      messagesWithReactions.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      const groupedMessages = groupReactionsByEmoji(messagesWithReactions);
      const allMessages =
        this.messageService.addLabelsToMessages(groupedMessages);

      return allMessages;
    } catch (error) {
      throw error;
    }
  }

  async updateThread(threadId: string, userId: string, threadName: string) {

    try {
      if (!threadId) {
        throw new HttpException('Thread ID is required', HttpStatus.BAD_REQUEST)
      }

      if (!threadName) {
        throw new HttpException("Thread name is required", HttpStatus.BAD_REQUEST)
      }

      const thread = await this.db.pool.query(`select id, author from threads where id = $1`, [threadId])
      if (thread.rows.length < 1) {
        throw new HttpException("Thread not found", HttpStatus.NOT_FOUND)
      }
      const { author } = thread.rows[0]
      if (author !== userId) {
        throw new HttpException("You are not allowed to edit this thread", HttpStatus.UNAUTHORIZED)
      }
      await this.db.pool.query(`update threads set name = $1 where id = $2`, [threadName, threadId])
      return {
        message: "Thread has successfully updated",
        error: false
      }
    } catch (error) {
      throw error
    }
  }


  async deleteThread(threadId: string, userId: string, serverId: string) {
    try {
      const server = await this.db.pool.query(`select id, owner_id from servers where id = $1`, [serverId])
      const { owner_id } = server.rows[0]

      const thread = await this.db.pool.query(`SELECT id, author FROM threads WHERE id = $1`, [threadId]);
      if (thread.rows.length < 1) {
        throw new HttpException('Thread not found', HttpStatus.NOT_FOUND);
      }
      const isallowedToDeleteThread = await this.isAllowedToManageThread(serverId, userId)


      if (isallowedToDeleteThread.length < 1 && owner_id === userId) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      await this.db.pool.query(`BEGIN`);
      const messages = await this.getThreadMessage(threadId, serverId);
      const messageIds = messages.map(msg => msg.message_id).flat();
      const mediaIds = messages.map(msg => msg.media_image_asset_id).filter(Boolean).flat();

      if (messageIds.length > 0) {
        const placeholders = messageIds.map((_, i) => `$${i + 1}`).join(',');
        await this.db.pool.query(`DELETE FROM messages WHERE id IN (${placeholders})`, messageIds);
      }

      if (mediaIds.length > 0) {
        for (const id of mediaIds) {
          await this.attachementService.deleteImage(id);
        }
      }

      await this.db.pool.query(`DELETE FROM threads WHERE id = $1`, [threadId]);
      await this.db.pool.query(`COMMIT`);
      return {
        message: 'Thread successfully deleted',
        error: false
      };
    } catch (error) {
      await this.db.pool.query(`ROLLBACK`);
      throw error;
    }
  }

  async getAllThreads(channelId: string, serverId: string) {
    try {
      const allThreads = await this.db.pool.query(
        `select 
        t.id as thread_id,
        t.message_id as message_id,
        t.author as author,
        t."name" as thread_name,
        sp.username as username,
        t.created_at as created_at,
        sp.avatar as avatar,
        t.channel_id as channel_id
        from threads as t
        join server_profile as sp on sp.user_id = t.author and sp.server_id = $2
        where t.channel_id = $1`,
        [channelId, serverId]
      );

      return {
        data: allThreads.rows,
        error: false,
      };
    } catch (error) {
      throw error;
    }
  }

  async replyThreadMessage(
    parentMessageId: string,
    threadId: string,
    content: string,
    user_id: string,
    imageUrl: string,
    imageAssetId: string
  ) {
    try {

      await this.db.pool.query('begin');

      const {
        rows: [msg],
      } = await this.db.pool.query(
        `insert into messages ("content", user_id, "type", image_url,image_asset_id)
        values($1, $2, 'threads', $3,$4)
        returning id`,
        [content, user_id, imageUrl, imageAssetId]
      );
      await this.db.pool.query(
        `insert into thread_messages_replies (parent_message_id,  message_id, thread_id)
	      values($1, $2, $3)`,
        [parentMessageId, msg.id, threadId]
      );

      await this.db.pool.query('commit');
    } catch (error) {
      await this.db.pool.query('rollback');
      throw error;
    }
  }
}
