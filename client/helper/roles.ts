import { Permission } from '@/types/server';
import { prepareHeaders } from './cookies';
import { ApiRequest } from '@/utils/api';

const serverUrl = process.env.SERVER_URL;
const api = new ApiRequest();

export interface Role {
  id: string;
  name: string;
  serverId: string;
  role_color: string;
  icon: string;
  icon_asset_id: string;
  members: any[];
  permissions: Permission;
}

export async function getAllRoles(serverId: string): Promise<Role[]> {
  try {
    const roles = await api.getData<Role[]>(
      `/roles/all-roles?serverId=${serverId}`,
    );
    return roles;
  } catch (error) {
    throw error;
  }
}

export async function updateRole(
  color: string = '#99aab5',
  name: string = 'new role',
  icon: string = '',
  iconAssetId: string = '',
  serverId: string,
  roleId: string,
  attachFile: boolean,
  banMember: boolean,
  kickMember: boolean,
  manageChannel: boolean,
  manageMessage: boolean,
  manageRole: boolean,
  manageThread: boolean,
) {
  try {
    await api.update(
      '/roles/update-role',
      {
        color,
        name,
        icon,
        icon_asset_id: iconAssetId,
        serverId,
        attach_file: attachFile,
        ban_member: banMember,
        kick_member: kickMember,
        manage_channel: manageChannel,
        manage_message: manageMessage,
        manage_role: manageRole,
        manage_thread: manageThread,
        roleId,
      },
      'PUT',
    );
  } catch (error) {
    throw error;
  }
}

export async function removeRoleFromUser(userId: string) {
  try {
    await api.update(
      '/roles/remove-role',
      {
        userId,
      },
      'DELETE',
    );
  } catch (error) {
    throw error;
  }
}

export async function getCurrentUserPermissions(
  userId: string,
  serverId: string,
): Promise<Permission> {
  try {
    const permission = await api.getData<Permission>(
      `/roles?userId=${userId}&serverId=${serverId}`,
    );
    return permission;
  } catch (error) {
    throw error;
  }
}
