'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';


import { PinnedMessageType } from '@/helper/message';
import { AllThread } from '@/helper/threads';
import { useServerStates, useSocketStore } from '@/providers';
import { Message } from '@/types/messages';
import useWindowResize from '@/hooks/useWindowResize';
import { BannedMembers } from '@/types/socket-states';
const ChannelsMessages = dynamic(() => import('./messages'), { ssr: false });
const ChannelDetailMobile = dynamic(() => import('./mobile'), { ssr: false });
const ChannelsHeader = dynamic(() => import('./header-desktop'), { ssr: false })
const VideoCall = dynamic(() => import('./video-call'), { ssr: false })

type Props = {
  channelName: string;
  channelId: string;
  serverId: string;
  threads: AllThread[];
  pinnedMessages: PinnedMessageType[];
  channel_type: string
};

export default function ChannelsDetail(props: Props) {
  const thread = useServerStates((state) => state.selectedThread);
  const socket = useSocketStore((state) => state.socket);
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([]);
  const { windowWidth } = useWindowResize()
  const { userId } = useAuth()

  useEffect(() => {
    if (props.serverId && props.channelId) {
      socket?.emit('get-channel-message', {
        serverId: props.serverId,
        channelId: props.channelId,
      });
    }
    socket?.emit('banned_members', { serverId: props.serverId })
    return () => {
      socket?.off('get-channel-message');
      socket?.off('banned_members')
    };
  }, [socket, props.serverId, props.channelId]);

  useEffect(() => {
    socket?.on('set-message', (messages) => setMessages(messages));
    socket?.on('set-banned-members', (members: BannedMembers[]) => {
      const membersMap = new Map(members.map(member => [member.id, member]))
      if (userId) {
        const isInclude = membersMap.get(userId)
        if (isInclude?.id === userId) {
          router.push('/direct-messages')
        }
      }

    })
    return () => {
      socket?.off('set-message');
      socket?.off('set-banned-members');
    }
  }, [router, socket, userId]);

  return (
    <>
      {props.channel_type === 'text' ? (
        <>
          {windowWidth >= 768 ? (
            <div className='no-scrollbar hidden max-h-screen min-h-screen w-full overflow-y-auto md:block'>
              <ChannelsHeader
                channelId={props.channelId}
                serverId={props.serverId}
                channelName={props.channelName}
                threads={props.threads}
                pinnedMessages={props.pinnedMessages}

              />
              {props.channel_type === 'text' ? (
                <ChannelsMessages
                  messages={messages}
                  // @ts-ignore
                  socket={socket}
                  thread={thread}
                />
              ) : (
                <VideoCall room={props.channelId} serverId={props.serverId} />
              )}

            </div>
          ) : (
            <ChannelDetailMobile
              threads={props.threads}
              pinnedMessages={props.pinnedMessages}
              channelId={props.channelId}
              serverId={props.serverId}
              messages={messages}
              socket={socket}
              thread={thread}
            />
          )}

        </>
      ) : (
        <VideoCall room={props.channelId} serverId={props.serverId} />
      )}
    </>
  );
}
