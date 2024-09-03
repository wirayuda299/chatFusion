import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class RolesService {
  constructor(private db: DatabaseService) { }

  async isAllowedToCreateRole(serverId: string, userId: string) {
    const isallowed = await this.db.pool.query(
      `SELECT p.manage_channel
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN user_roles ur ON rp.role_id = ur.role_id
        JOIN members m ON ur.user_id = m.user_id
        WHERE m.user_id = $1
        AND m.server_id = $2
        AND p.manage_role = true`,
      [serverId, userId]
    );
    return isallowed.rows;
  }

  async createRole(
    color: string = '#99aab5',
    name: string = 'new role',
    icon: string = '',
    icon_asset_id: string = '',
    serverId: string,
    attach_file: boolean = false,
    ban_member: boolean = false,
    kick_member: boolean = false,
    manage_channel: boolean = false,
    manage_message: boolean = false,
    manage_role: boolean = false,
    manage_thread: boolean = false,
    userId: string,
    serverAuthor: string
  ) {
    try {
      const isAllowed = await this.isAllowedToCreateRole(serverId, userId);

      if (isAllowed.length < 1 && userId !== serverAuthor) {
        throw new HttpException(
          'You are not allowed to create role',
          HttpStatus.FORBIDDEN
        );
      }

      await this.db.pool.query(`begin`);
      const {
        rows: [role],
      } = await this.db.pool.query(
        `insert into roles(server_id, name, icon, role_color, icon_asset_id)
        values($1, $2, $3, $4, $5)
        returning id`,
        [serverId, name, icon, color, icon_asset_id]
      );
      const {
        rows: [permission],
      } = await this.db.pool.query(
        `insert into permissions(manage_channel, manage_role, kick_member, ban_member,attach_file, manage_thread, manage_message, server_id)
        values($1, $2, $3, $4, $5, $6, $7, $8)
        returning id`,
        [
          manage_channel,
          manage_role,
          kick_member,
          ban_member,
          attach_file,
          manage_thread,
          manage_message,
          serverId,
        ]
      );
      await this.db.pool.query(
        `insert into role_permissions(role_id, permission_id)
      values($1, $2)
      `,
        [role.id, permission.id]
      );
      await this.db.pool.query(`commit`);
    } catch (error) {
      await this.db.pool.query(`rollback`);
      throw error;
    }
  }

  async getAllRolesInAServer(serverId: string) {
    try {
      const roles = await this.db.pool.query(
        `select * from roles where server_id = $1`,
        [serverId]
      );

      for await (const role of roles.rows) {
        const member = await this.db.pool.query(
          `select * from user_roles where role_id = $1`,
          [role.id]
        );
        const permissions = await this.db.pool.query(
          `select * from role_permissions as rp
          join permissions as p on p.id= rp.permission_id
          where rp.role_id= $1`,
          [role.id]
        );
        role.members = member.rows;
        role.permissions = permissions.rows[0];
      }

      return {
        data: roles.rows,
        error: false,
      };
    } catch (error) {
      throw error;
    }
  }

  async assignRoleToUser(
    role_id: string,
    user_id: string,
    permission_id: string
  ) {
    try {
      await this.db.pool.query(
        `insert into user_roles(user_id, role_id, permission_id)
          values($1,$2,$3)`,
        [user_id, role_id, permission_id]
      );
    } catch (error) {
      throw error;
    }
  }

  async updateRole(
    color: string = '#99aab5',
    name: string = 'new role',
    icon: string = '',
    icon_asset_id: string = '',
    serverId: string,
    roleId: string,
    attach_file: boolean = false,
    ban_member: boolean = false,
    kick_member: boolean = false,
    manage_channel: boolean = false,
    manage_message: boolean = false,
    manage_role: boolean = false,
    manage_thread: boolean = false
  ) {
    try {
      await this.db.pool.query(`begin`);
      await this.db.pool.query(
        `
      update roles 
      set name = $1, 
      icon = $2, 
      role_color = $3, 
      icon_asset_id = $4
      where id = $5`,
        [name, icon, color, icon_asset_id, roleId]
      );

      await this.db.pool.query(
        `update permissions
          set manage_channel = $1, manage_role=$2, kick_member = $3, ban_member=$4,attach_file=$5, manage_thread=$6, manage_message= $7
          where server_id = $8`,
        [
          manage_channel,
          manage_role,
          kick_member,
          ban_member,
          attach_file,
          manage_thread,
          manage_message,
          serverId,
        ]
      );
      await this.db.pool.query(`commit`);
    } catch (error) {
      await this.db.pool.query(`rollback`);
      throw error;
    }
  }

  async getCurrentUserRole(userId: string, serverId: string) {
    try {
      const role = await this.db.pool.query(
        `
        select * from role_permissions as rp
        join roles as r on r.id = rp.role_id 
        join permissions as p on p.id = rp.permission_id 
        join user_roles as ur on ur.role_id = r.id 
        where ur.user_id = $1 and r.server_id = $2
      `,
        [userId, serverId]
      );

      return {
        data: role.rows[0],
        error: false,
      };
    } catch (error) {
      throw error;
    }
  }

  async removeRole(userId: string) {
    try {
      await this.db.pool.query(
        `delete from user_roles
         where user_id = $1`,
        [userId]
      );
    } catch (error) {
      throw error;
    }
  }
}
