import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { groupReactionsByEmoji } from '../../common/utils/groupMessageByEmoji';
import { RolesService } from '../roles/roles.service';
import { Message } from 'src/types';
import { ReactionsService } from '../reactions/reactions.service';

@Injectable()
export class MessagesService {
  constructor(
    private db: DatabaseService,
    private roleService: RolesService,
    private reactionService: ReactionsService
  ) { }

  addLabelsToMessages(messages: Message[]) {
    let currentMonth: number | null = null;

    return messages?.map((message) => {
      const messageDate = new Date(message.created_at);
      const messageMonth = messageDate.getMonth();

      const shouldAddLabel = currentMonth !== messageMonth;

      currentMonth = messageMonth;

      return { ...message, shouldAddLabel };
    });
  }

  async getReplies(
    parentMessageId: string,
    channelId: string,
    serverId: string
  ): Promise<Message[]> {
    try {
      const replies = await this.db.pool.query(
        `SELECT
        mr.parent_message_id as parent_message_id,
        mr.id as reply_id,
        mr.author as author_id,
        m."content" as message,
        m.id as message_id,
        m.is_read as is_read,
        m.user_id as author,
        m.image_url as media_image,
        m."type" as message_type,
        m.image_asset_id as media_image_asset_id,
        m.created_at as created_at,
        m.updated_at as update_at,
        sp.username as username
      FROM messages_replies as mr 
      JOIN messages as m ON m.id = mr.message_id
      JOIN server_profile as sp ON sp.user_id = m.user_id AND sp.server_id = $2
      WHERE mr.parent_message_id = $1 
      ORDER BY m.created_at ASC`,
        [parentMessageId, serverId]
      );

      const replyPromises = replies.rows.map(async (reply) => {
        const [reactions, role, threads] = await Promise.all([
          this.reactionService.getReactions(reply.message_id),
          this.roleService.getCurrentUserRole(reply.user_id, serverId),
          this.db.pool.query(
            `SELECT
            sp.username as username,
            sp.user_id as author_id,
            t.name as thread_name,
            t.id as thread_id,
            t.channel_id as channel_id
          FROM threads as t
          JOIN server_profile as sp ON sp.user_id = t.author AND sp.server_id = $2
          WHERE t.message_id = $1`,
            [reply.message_id, serverId]
          ),
        ]);

        reply.reactions = reactions;
        reply.role = role.data;
        reply.threads = threads.rows || [];

        return reply;
      });

      const allReplies = await Promise.all(replyPromises);

      const subRepliesPromises = allReplies.map(async (reply) => {
        const subReplies = await this.getReplies(
          reply.message_id,
          channelId,
          serverId
        );

        for (const subReply of subReplies) {
          const reactions = await this.reactionService.getReactions(
            subReply.message_id
          );
          subReply.reactions = reactions;
        }

        return [reply, ...subReplies];
      });

      const nestedReplies = await Promise.all(subRepliesPromises);
      const flattenedReplies = nestedReplies.flat();

      return flattenedReplies;
    } catch (error) {
      throw error;
    }
  }

  async sendMessage(
    content: string,
    user_id: string,
    channelId: string,
    imageUrl: string,
    imageAssetId: string
  ) {
    try {
      try {
        await this.db.pool.query('BEGIN');
        const {
          rows: [message],
        } = await this.db.pool.query(
          `INSERT INTO messages(content, user_id, image_url, image_asset_id, type)
           VALUES($1, $2, $3, $4, $5)
           RETURNING id`,
          [content, user_id, imageUrl ?? '', imageAssetId ?? '', 'channel']
        );
        console.log({ message })
        const messageId = message.id;

        await this.db.pool.query(
          `INSERT INTO channel_messages (channel_id, message_id)
       VALUES($1, $2)`,
          [channelId, messageId]
        );

        await this.db.pool.query('COMMIT');
      } catch (e) {
        await this.db.pool.query('ROLLBACK');
        throw e;
      }
    } catch (error) {
      throw error;
    }
  }

  async replyMessage(
    parentMessageId: string,
    content: string,
    user_id: string,
    imageUrl: string = '',
    imageAssetId: string = '',
    type: string
  ) {
    try {
      await this.db.pool.query('begin');
      const {
        rows: [message],
      } = await this.db.pool.query(
        `INSERT INTO messages("content", user_id, image_url, image_asset_id, type)
       VALUES($1, $2, $3, $4, $5)
       returning id`,
        [content, user_id, imageUrl, imageAssetId, type]
      );

      await this.db.pool.query(
        `insert into messages_replies (parent_message_id, author, message_id)
        values($1,$2,$3)`,
        [parentMessageId, user_id, message.id]
      );
      await this.db.pool.query('commit');
    } catch (error) {
      await this.db.pool.query('rollback');
      throw error;
    }
  }

  async getThreadByMessage(messageId: string, serverId: string) {
    try {
      const threads = await this.db.pool.query(
        `
          select
          sp.username as username,
          sp.user_id as author_id,
          t.name as thread_name,
          t.id as thread_id,
          t.channel_id as channel_id
          from threads as t
          join server_profile as sp on sp.user_id = t.author and sp.server_id = $2
          where t.message_id = $1
        `,
        [messageId, serverId]
      );

      for await (const thread of threads.rows) {
        const role = await this.roleService.getCurrentUserRole(
          thread.author_id,
          serverId
        );

        thread.role = role.data;
      }

      return threads.rows;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getMessageByChannelId(channel_id: string, serverId: string) {
    try {
      const messages = await this.db.pool.query(
        `
        SELECT 
        cm.message_id AS message_id,
        m."content" AS message,
        m.is_read AS is_read,
        m.user_id AS author,
        m.image_url AS media_image,
        m."type" AS message_type,
        m.image_asset_id AS media_image_asset_id,
        m.created_at AS created_at,
        m.updated_at AS update_at,
        sp.username AS username
        FROM channel_messages AS cm
        JOIN messages AS m ON m.id = cm.message_id 
        JOIN server_profile AS sp ON sp.user_id = m.user_id AND sp.server_id = $1
        WHERE cm.channel_id = $2 AND m.type = 'channel'
        ORDER BY m.created_at ASC
      `,
        [serverId, channel_id]
      );

      const messagePromises = messages.rows.map(async (message) => {
        const [reactions, threads, role] = await Promise.all([
          this.reactionService.getReactions(message.message_id),
          this.getThreadByMessage(message.message_id, serverId),
          this.roleService.getCurrentUserRole(message.author, serverId),
        ]);

        message.role = role.data;
        message.threads = threads || [];
        message.reactions = reactions;

        const replies = await this.getReplies(
          message.message_id,
          channel_id,
          serverId
        );

        return [message, ...replies];
      });

      const allMessageResults = await Promise.all(messagePromises);
      const allMessages = allMessageResults.flat();

      allMessages.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      const groupedMessages = groupReactionsByEmoji(allMessages);
      const finalMessages = this.addLabelsToMessages(groupedMessages);

      return finalMessages;
    } catch (error) {
      throw error;
    }
  }

  async pinMessage(messageId: string, channel_id: string, pinnedBy: string) {
    try {
      const messageExists = await this.db.pool.query(
        `SELECT EXISTS(SELECT 1 FROM messages WHERE id = $1)`,
        [messageId]
      );

      if (!messageExists.rows[0].exists) {
        throw new HttpException("Message doesn't exists", HttpStatus.NOT_FOUND);
      }
      const isAlreadyPinned = await this.db.pool.query(
        `select exists(select * from channel_pinned_messages
        where message_id = $1)`,
        [messageId]
      );

      if (isAlreadyPinned.rows[0].exists) {
        throw new HttpException('Message already pinned', 400);
      }

      await this.db.pool.query(
        `INSERT INTO channel_pinned_messages(message_id, channel_id, pinned_by) 
            VALUES($1,$2, $3)`,
        [messageId, channel_id, pinnedBy]
      );
      return {
        message: 'Message pinned',
        error: false,
      };
    } catch (e) {
      throw e;
    }
  }

  async deleteChannelPinnedMessage(messageId: string, channelId: string) {
    try {
      await this.db.pool.query(
        `
      delete from channel_pinned_messages as cpm
      where cpm.message_id = $1 and cpm.channel_id = $2
      `,
        [messageId, channelId]
      );
      return {
        message: 'Pinned message deleted',
        error: false,
      };
    } catch (error) {
      throw error;
    }
  }

  async getPinnedMessages(channelId: string, serverId: string) {
    try {
      const pinnedMessages = await this.db.pool.query(
        `select
          pm.message_id as message_id,
          pm.channel_id as channel_id, 
          m."content" as message, 
          m.image_url as image,
          sp.user_id as pinned_by,
          sp.username as username,
          sp.avatar as avatar,
          pm.created_at as created_at
          from channel_pinned_messages as pm
          join messages as m on m.id = pm.message_id
          join server_profile as sp on sp.user_id = pm.pinned_by and sp.server_id = $1
          where pm.channel_id = $2`,
        [serverId, channelId]
      );
      return {
        data: pinnedMessages.rows,
        error: false,
      };
    } catch (error) {
      throw error;
    }
  }

  async getPersonalPinnedMessages(conversationId: string) {
    try {
      const pinnedMessages = await this.db.pool.query(
        `select
          ppm.message_id as message_id, 
          ppm.pinned_by as pinned_by,
          m."content" as message,
          m.image_url as image,
          u.image as avatar,
          u.username as username,
          ppm.created_at as created_at 
          from personal_pinned_messages as ppm
          join messages as m on m.id = ppm.message_id
          join users as u on ppm.pinned_by = u.id
          where ppm.conversation_id = $1 `,
        [conversationId]
      );
      return {
        data: pinnedMessages.rows,
        error: false,
      };
    } catch (error) {
      console.log(error);

      throw error;
    }
  }

  async editMessage(
    messageAuthor: string,
    currentUser: string,
    messageId: string,
    content: string
  ) {
    try {
      if (messageAuthor !== currentUser) {
        throw new HttpException(
          'You are not allowed to edit this message',
          HttpStatus.UNAUTHORIZED
        );
      }
      const message = await this.db.pool.query(
        `select * from messages where id = $1`,
        [messageId]
      );

      if (message.rows.length < 1) {
        throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
      }
      await this.db.pool.query(
        `update messages
        set content = $1,
        updated_at = NOW()
        where id = $2`,
        [content, messageId]
      );
      return {
        message: 'Message updated',
        error: false,
      };
    } catch (error) {
      throw error;
    }
  }

  async sendPersonalMessage(
    content: string,
    userId: string,
    image_url: string = '',
    image_asset_id: string = '',
    recipientId: string
  ) {
    try {
      await this.db.pool.query(`BEGIN`);

      const conversationExistsQuery = `
        SELECT id
        FROM conversations
        WHERE (sender_id = $1 AND recipient_id = $2)
        OR (sender_id = $2 AND recipient_id = $1)`;

      const { rows } = await this.db.pool.query(conversationExistsQuery, [
        userId,
        recipientId,
      ]);

      let conversationId = '';

      if (rows.length > 0) {
        conversationId = rows[0].id;
      } else {
        const {
          rows: [conversation],
        } = await this.db.pool.query(
          `INSERT INTO conversations (sender_id, recipient_id)
           VALUES ($1, $2)
           RETURNING id`,
          [userId, recipientId]
        );

        conversationId = conversation.id;
      }

      const {
        rows: [message],
      } = await this.db.pool.query(
        `INSERT INTO messages("content", user_id, "type", image_url, image_asset_id)
         VALUES ($1, $2, 'personal', $3, $4)
         RETURNING id`,
        [content, userId, image_url, image_asset_id]
      );

      await this.db.pool.query(
        `INSERT INTO personal_messages(conversation_id, message_id)
         VALUES ($1, $2)`,
        [conversationId, message.id]
      );

      await this.db.pool.query(`COMMIT`);
    } catch (error) {
      await this.db.pool.query(`ROLLBACK`);
      throw error;
    }
  }

  async fetchReplies(
    messageId: string,
    messages: any[],
    conversationId: string
  ) {
    const replies = await this.db.pool.query(
      `SELECT
          mr.parent_message_id as parent_message_id,
          mr.id as reply_id,
          mr.author as author_id,
          m."content" as message,
          m.id as message_id,
          m.is_read as is_read,
          m.user_id as author,
          m.image_url as media_image,
          m."type" as message_type,
          m.image_asset_id as media_image_asset_id,
          m.created_at as created_at,
          m.updated_at as update_at,
          u.username as username
          FROM messages_replies as mr 
          JOIN messages as m ON m.id = mr.message_id
          JOIN users as u on u.id = m.user_id 
          WHERE mr.parent_message_id = $1 
          ORDER BY m.created_at ASC`,
      [messageId]
    );

    for await (const reply of replies.rows) {
      reply.conversation_id = conversationId;
      const replyReactions = await this.reactionService.getReactions(
        reply.message_id
      );
      reply.reactions = replyReactions;
      messages.push(reply);
      await this.fetchReplies(reply.message_id, messages, conversationId);
    }
  }

  async getPersonalMessage(
    conversationId: string | null,
    userId: string | null
  ) {
    try {
      const messages = [];

      const baseMessages = await this.db.pool.query(
        `SELECT
        pm.conversation_id as conversation_id,
        m.content AS message,
        m.is_read AS is_read,
        m.user_id AS author,
        m.id as message_id,
        m.image_url AS media_image,
        m.type AS message_type,
        m.image_asset_id AS media_image_asset_id,
        m.created_at AS created_at,
        m.updated_at AS update_at,
        u.username AS username
        FROM personal_messages AS pm
        JOIN messages AS m ON m.id = pm.message_id
        JOIN users AS u ON u.id = m.user_id
        WHERE pm.conversation_id = COALESCE($1, pm.conversation_id)
        OR m.user_id = COALESCE($2, m.user_id)`,
        [conversationId, userId]
      );

      for await (const message of baseMessages.rows) {
        const reactions = await this.reactionService.getReactions(
          message.message_id
        );
        message.reactions = reactions;
        messages.push(message);
        await this.fetchReplies(
          message.message_id,
          messages,
          message.conversation_id
        );
      }

      messages.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      const groupedMessages = groupReactionsByEmoji(messages);
      const allMessages = this.addLabelsToMessages(groupedMessages);
      return allMessages;
    } catch (error) {
      throw error;
    }
  }

  async pinPersonalMessage(
    messageId: string,
    pinnedBy: string,
    conversationId: string
  ) {
    try {
      const message = await this.db.pool.query(
        `select * from personal_pinned_messages as ppm
        where message_id = $1`,
        [messageId]
      );
      if (message.rows.length >= 1) {
        throw new HttpException(
          'Message already pinned',
          HttpStatus.BAD_REQUEST
        );
      }
      await this.db.pool.query(
        `
      insert into personal_pinned_messages(message_id, pinned_by, conversation_id)
      values($1, $2, $3)
      `,
        [messageId, pinnedBy, conversationId]
      );

      return {
        message: 'Message pinned',
        error: false,
      };
    } catch (error) {
      throw error;
    }
  }

  async deletePersonalPinnedMessage(messageId: string) {
    try {
      await this.db.pool.query(
        `
    delete from personal_pinned_messages as ppr
    where ppr.message_id = $1
    `,
        [messageId]
      );

      return {
        message: 'Pinned message deleted',
        error: false,
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteMessage(id: string) {
    try {
      const foundMessage = await this.db.pool.query(
        `select * from messages where id = $1`,
        [id]
      );
      if (foundMessage.rows.length < 1) {
        throw new NotFoundException('Message not found');
      }
      await this.db.pool.query(`delete from messages where id = $1`, [id]);
      return {
        messages: 'Message deleted',
        error: false,
      };
    } catch (error) {
      throw error;
    }
  }
}
