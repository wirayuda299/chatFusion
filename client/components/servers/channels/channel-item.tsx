'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react'
import { Cog } from 'lucide-react';


import { Categories } from '@/types/channels';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { Servers } from '@/types/server';
import { useServerStates } from '@/providers';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import ChannelSetting from './settings';

export default function ChannelItem({
  category,
  server,
}: {
  category: Categories;
  server: Servers;
}) {
  const router = useRouter()
  const params = useParams();
  const { selectedChannel, setSelectedChannel } = useServerStates(
    (state) => ({
      setSelectedChannel: state.setSelectedChannel,
      selectedChannel: state.selectedChannel

    })
  );
  const [isOpen, setIsOpen] = useState(false)

  const reset = useCallback(() => {
    setSelectedChannel(null)
    setIsOpen(false)
  }, [setSelectedChannel])

  const handleClose = useCallback(() => {
    router.push(`/server/${server.id}`)
    reset()
  }, [reset, router, server.id])


  return (
    <li key={category.category_id}>
      <Accordion type='multiple'>
        <AccordionItem className='border-none' value={category.channel_name}>
          <AccordionTrigger
            aria-label='view channels'
            name='view channels'
            title='view channels'
            className='text-base font-normal hover:text-white'
          >
            {category.category_name}
          </AccordionTrigger>
          <AccordionContent>
            {category?.channels.map((channel) => (
              <div key={channel.category_id} className={cn('flex-center justify-between w-full group hover:bg-background/50 pl-5 py-1 pr-2 rounded-sm md:hover:bg-foreground/60 hover:text-white hover:brightness-105', params.channel_id === channel.channel_id &&
                'md:bg-foreground bg-background/50 md:brightness-110',
              )}>

                <Link
                  aria-label={'reset'}
                  onClick={
                    () => setSelectedChannel(channel)
                  }
                  scroll={false}
                  href={{
                    pathname: `/server/${server.id as string}/${channel.channel_id}`,
                    search: `channel_type=${channel.channel_type
                      }&channel_name=${encodeURIComponent(channel.channel_name)}`,
                  }}
                  prefetch
                  key={channel.channel_id}
                  className='flex-center gap-2 text-base w-full'>
                  <div className='flex items-center gap-3'>
                    <Image
                      src={`/server/icons/${channel.channel_type === 'text'
                        ? 'hashtag.svg'
                        : 'audio.svg'
                        }`}
                      width={18}
                      height={18}
                      alt='audio'
                    />
                    {channel.channel_name}

                  </div>

                </Link>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger className='group-hover:opacity-100 opacity-0' onClick={e => {
                    e.stopPropagation()
                    e.preventDefault()
                    setIsOpen(true)
                    setSelectedChannel(channel)
                  }}>
                    <Cog size={18} className='text-gray-2' />
                  </DialogTrigger>
                  <DialogContent className='md:border-none border-gray-1 rounded-lg bg-black md:bg-foreground'>
                    <ChannelSetting
                      selectedChannel={selectedChannel}
                      serverId={server.id}
                      serverAuthor={server.owner_id}
                      reset={reset}
                      handleClose={handleClose}
                    />
                  </DialogContent>
                </Dialog>
              </div>

            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </li>
  );
}
