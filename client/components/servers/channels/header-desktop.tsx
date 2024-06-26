'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { ChevronRight, X } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { Suspense } from 'react';

const NotificationSettings = dynamic(
  () => import('@/components/servers/notification-settings'),
);
const ThreadList = dynamic(
  () => import('@/components/servers/threads/thread-list'),
);
const Inbox = dynamic(() => import('@/components/shared/inbox'));
const PinnedMessage = dynamic(
  () => import('@/components/shared/pinned-message'),
);

import { PinnedMessageType, deleteChannelPinnedMessage } from '@/helper/message';
import { AllThread } from '@/helper/threads';
import SearchForm from '@/components/shared/search-form';
import { useServerStates } from '@/providers';
const ServerMembers = dynamic(() => import('../members'), { ssr: false })
import { cn } from '@/lib/utils';


type Props = {
  channelName: string;
  pinnedMessages: PinnedMessageType[];
  threads: AllThread[];
  channelId: string;
  serverId: string;
};

export default function ChannelsHeader({
  channelName,
  pinnedMessages,
  threads,
  channelId,
  serverId,
}: Props) {
  const { thread, setSelectedThread, selectedChannel } = useServerStates(
    useShallow((state) => ({
      thread: state.selectedThread,
      setSelectedThread: state.setSelectedThread,
      selectedChannel: state.selectedChannel
    })),
  );



  return (
    <header className='flex-center sticky top-0 z-10 h-[49px] min-w-full justify-between border-b border-background bg-foreground p-2'>
      <div className='flex-center gap-2'>
        <Image
          src={'/server/icons/hashtag.svg'}
          width={20}
          height={20}
          alt='hashtag'
        />
        <h3
          onClick={thread ? () => setSelectedThread(null) : undefined}
          className={cn('truncate text-base font-semibold text-gray-2', thread ? 'cursor-pointer' : 'cursor-auto')}
        >
          {channelName}
        </h3>
        {thread ? (
          <div className='flex-center gap-2'>
            <ChevronRight size={10} />
            <Image
              src={'/general/icons/threads.svg'}
              width={20}
              height={20}
              alt='threads'
            />
            <h3 className='truncate text-sm text-white'>
              {thread.thread_name}
            </h3>
          </div>
        ) : (
          <p className='text-xs truncate'>{selectedChannel?.topic}</p>
        )}
      </div>
      <div className='flex-center gap-3 overflow-x-auto'>
        <Suspense fallback={<div className='w-full min-h-9 rounded bg-foreground brightness-110 animate-pulse'></div>} key={channelId}>

          <ThreadList threads={threads} serverId={serverId} channelId={channelId} />
          <NotificationSettings />
          <PinnedMessage pinnedMessages={pinnedMessages} type='channel'>
            <ul className='relative flex max-h-96 flex-col gap-6 overflow-y-auto p-3'>
              {pinnedMessages?.map((msg) => (
                <li
                  key={msg?.message_id}
                  className='group flex justify-between rounded-md p-2 hover:bg-foreground hover:brightness-125'
                >
                  <div className='flex-center gap-2'>
                    <Image
                      src={msg.avatar}
                      width={35}
                      height={35}
                      alt='author'
                      className='size-9 rounded-full object-cover'
                    />
                    <div className=''>
                      <h5 className='flex-center gap-2 truncate text-sm text-white'>
                        {msg.username}
                        <span className='text-[10px] text-white'>
                          {new Date(msg.created_at).toLocaleString()}
                        </span>
                      </h5>
                      <p className='truncate text-sm font-medium text-white'>
                        {msg.message}
                      </p>
                    </div>
                  </div>
                  <button
                    aria-label='delete'
                    name='delete'

                    onClick={() => deleteChannelPinnedMessage(msg.message_id, channelId, `/server/${serverId}/${channelId}`)}
                    title='delete'
                    className='absolute right-1 hidden size-5 rounded-full bg-foreground text-xs text-white group-hover:block'
                  >
                    <X size={15} className='mx-auto' />
                  </button>
                </li>
              ))}
            </ul>
          </PinnedMessage>
          <ServerMembers serverId={serverId}>
            <Image
              className='min-w-6'
              src={'/server/icons/member.svg'}
              width={24}
              height={24}
              alt='member'
            />
          </ServerMembers>
          <SearchForm />
          <Inbox>Channel inbox</Inbox>
          <Image
            className='min-w-6'
            src={'/general/icons/ask.svg'}
            width={24}
            height={24}
            alt='ask'
          />

        </Suspense>

      </div>
    </header>
  );
}
