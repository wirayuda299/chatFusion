export type Permission = {
  role_id: string;
  permission_id: string;
  id: string;
  manage_channel: boolean;
  manage_role: boolean;
  kick_member: boolean;
  ban_member: boolean;
  attach_file: boolean;
  manage_thread: boolean;
  manage_message: boolean;
};

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

export type Thread = {
  username: string;
  author_id: string;
  thread_name: string;
  thread_id: string;
  channel_id: string;
  message: string;
  is_read: boolean;
  author: string;
  media_image: string;
  message_type: string;
  media_image_asset_id: string;
  created_at: string;
  update_at: string;
};

export interface Message {
  message_id: string;
  message: string;
  is_read: boolean;
  author: string;
  media_image: string;
  message_type: string;
  media_image_asset_id: string;
  created_at: string;
  update_at: string;
  username: string;
  shouldAddLabel: boolean;
  parent_message_id: string;
  threads: Thread[];
  reactions: {
    emoji: string;
    unified_emoji: string;
    count: number;
  }[];
  reply_id?: string;
  thread_name?: string;
  role: Role | undefined;
}
