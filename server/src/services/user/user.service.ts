import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class UserService {
  constructor(private databaseService: DatabaseService) { }

  async createUser(id: string, name: string, email: string, image: string) {
    try {
      await this.databaseService.pool.query(
        `INSERT INTO USERS(id, username, image, email) 
        VALUES($1, $2, $3, $4)`,
        [id, name, image, email]
      );

      return {
        message: 'User created',
        error: false,
      };
    } catch (error) {
      throw error;
    }
  }

  async findAllUser(id: string) {
    try {
      if (!id) throw new BadRequestException('Id is required');

      const users = await this.databaseService.pool.query(
        `SELECT * FROM USERS WHERE id != $1 ORDER BY created_at desc`,
        [id]
      );

      return {
        data: users.rows,
        error: false,
      };
    } catch (error) {
      throw error;
    }
  }

  async getUserById(id: string): Promise<NotFoundException | any> {
    try {
      const user = await this.databaseService.pool.query(
        `select * from users where id = $1`,
        [id]
      );

      if (user.rows.length < 1) throw new NotFoundException('User not found');

      return {
        data: user.rows[0],
        error: false,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateUser(
    name: string,
    id: string,
    bio: string,
    image?: string,
    imageAssetId?: string
  ) {
    try {
      const user = await this.getUserById(id);

      if (user.status === 404) {
        throw new NotFoundException('User not found');
      }

      if (image) {
        await this.databaseService.pool.query(
          `update users
            set username = $1,
            image = $2,
            image_asset_id = $3,
            bio = $4
            where id = $5`,
          [name, image, imageAssetId, bio, id]
        );

        return {
          message: 'User updated',
          error: false,
        };
      } else {
        await this.databaseService.pool.query(
          `update users
            set username = $1,
                bio = $2
            where id = $3`,
          [name, bio, id]
        );
        return {
          message: 'User updated',
          error: false,
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async deleteUser(id: string) {
    try {
      const user = await this.getUserById(id);
      if (user.status === 404) throw new NotFoundException('User not found');

      await this.databaseService.pool.query(`delete from users where id = $1`, [
        id,
      ]);

      return {
        message: `User with ID: ${id} has been deleted`,
      };
    } catch (error) {
      throw error;
    }
  }

  async searchUser(name: string, id: string) {
    try {
      if (name) {
        const users = await this.databaseService.pool.query(
          `select * from users 
           where to_tsvector(username) @@ to_tsquery($1)
          AND username != (SELECT username FROM users WHERE id = $2)`,
          [name.toLowerCase(), id]
        );
        return {
          data: users.rows,
          error: false,
        };
      }
    } catch (error) {
      throw error;
    }
  }
}
