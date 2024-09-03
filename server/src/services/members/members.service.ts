import {
  Injectable,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { ServersService } from '../servers/servers.service';
import { ChannelsService } from '../channels/channels.service';

@Injectable()
export class MembersService {
  constructor(
    private db: DatabaseService,
    private serverService: ServersService,
    private channelService: ChannelsService
  ) { }

  async isAllowedToKickMember(serverId: string, userId: string) {
    const isallowed = await this.db.pool.query(
      `SELECT p.manage_channel
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN user_roles ur ON rp.role_id = ur.role_id
        JOIN members m ON ur.user_id = m.user_id
        WHERE m.user_id = $1
        AND m.server_id = $2
        AND p.kick_member = true`,
      [serverId, userId]
    );
    return isallowed.rows;
  }

  async isMemberOrServerAuthor(userId: string, serverId: string) {
    try {
      const member = await this.db.pool.query(
        `
          select * from members as m
           where m.user_id = $1 
          and m.server_id = $2
          `,
        [userId, serverId]
      );
      const author = await this.db.pool.query(
        `select * from servers as s
          where s.owner_id = $1 and s.id = $2`,
        [userId, serverId]
      );

      return {
        data: {
          isMember: member.rows.length >= 1,
          isAuthor: author.rows.length >= 1,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async getMemberInServer(serverId: string) {
    try {
      const members = await this.db.pool.query(
        ` select * from members as m
          join server_profile as sp on sp.user_id = m.user_id 
          and sp.server_id = $1 
          where m.server_id = $1`,
        [serverId]
      );

      for await (const member of members.rows) {
        const role = await this.db.pool.query(
          `select * from role_permissions as rp
          join roles as r on r.id = rp.role_id 
          join permissions as p on p.id = rp.permission_id 
          join user_roles as ur on ur.role_id = r.id 
          where ur.user_id = $1 and r.server_id = $2`,
          [member.user_id, serverId]
        );
        const serverProfile = await this.serverService.getServerProfile(
          serverId,
          member.user_id
        );

        member.role = role.rows[0];
        member.serverProfile = serverProfile.data;
      }
      return {
        data: members.rows,
        error: false,
      };
    } catch (error) {
      throw error;
    }
  }

  async getMembersFromSpesificRole(serverId: string, roleName: string) {
    try {
      const members = await this.db.pool.query(
        ` SELECT *
          FROM members m
          JOIN user_roles ur ON m.user_id = ur.user_id
          JOIN roles r ON ur.role_id = r.id
          join server_profile as sp on sp.server_id = $1 and sp.user_id = ur.user_id
          WHERE m.server_id = $1 AND r.name = $2`,
        [serverId, roleName]
      );

      return {
        data: members.rows,
        error: false,
      };
    } catch (error) {
      throw error;
    }
  }

  async getMembersHasNoRole(serverId: string) {
    try {
      const members = await this.db.pool.query(
        `  select * from members as m
        left join user_roles as ur on ur.user_id = m.user_id
        join server_profile as sp on sp.server_id= $1 and sp.user_id= m.user_id 
        where m.server_id = $1
        and ur.role_id is null`,
        [serverId]
      );

      return {
        data: members.rows,
        error: false,
      };
    } catch (error) {
      throw error;
    }
  }


  async banMember(serverId: string, memberId: string, bannedBy: string) {

    try {
      const channelList = await this.channelService.getAllChannelsInServer(serverId);
      const channelIds = channelList.data.filter(channel => channel.channel_type === 'text').map(c => c.channel_id)

      await this.db.pool.query('BEGIN');
      await this.db.pool.query(
        `INSERT INTO banned_members(server_id, member_id, banned_by)
            VALUES($1, $2, $3)`,
        [serverId, memberId, bannedBy]
      );
      await this.db.pool.query('COMMIT');

      await this.db.pool.query('BEGIN');
      await this.serverService.leaveServer(serverId, memberId, channelIds);
      await this.db.pool.query('COMMIT');

      return {
        message: 'Member banned',
        error: false,
      };
    } catch (error) {
      await this.db.pool.query('ROLLBACK');
      console.error('Error in banMember:', error);
      throw error;
    }
  }
  async revokeBannedMember(serverId: string, memberId: string) {
    try {
      await this.db.pool.query(
        `delete from banned_members as bm where bm.server_id= $1 and bm.member_id = $2 `,
        [serverId, memberId]
      );
      return {
        message: 'Member removed from banned member list',
        error: false,
      };
    } catch (error) {
      throw error;
    }
  }

  async getBannedMembers(serverId: string) {
    try {
      const bannedMembers = await this.db.pool.query(
        `SELECT * 
       FROM banned_members AS bm
       JOIN users AS u ON u.id = bm.member_id 
       WHERE bm.server_id = $1 AND bm.server_id = $1`,
        [serverId]
      );
      return {
        data: bannedMembers.rows,
        error: false,
      };
    } catch (error) {
      throw error;
    }
  }
}
