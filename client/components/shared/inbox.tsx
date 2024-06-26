'use client';

import { type ReactNode, useState } from 'react';
import Image from 'next/image';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const items = ['for you', 'unreads', 'mentions'] as const;

export default function Inbox({ children }: { children: ReactNode }) {
  const [selectedFilter, setSelectedFilter] =
    useState<(typeof items)[number]>('for you');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label='inbox' name='inbox' title='inbox'>
        <Image
          className='min-w-7'
          src={'/general/icons/inbox.svg'}
          width={24}
          height={24}
          alt={'inbox'}
          key={'inbox'}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='mt-3 w-full border-none bg-foreground p-0 text-white md:min-w-96'>
        <header className='min-h-10 bg-foreground p-2'>
          <div className='flex w-full items-center justify-between gap-3 text-white'>
            <div className='flex items-center gap-2 border-r border-r-background pr-5'>
              <Image
                src={'/general/icons/inbox.svg'}
                width={30}
                height={30}
                alt={'inbox'}
                key={'inbox'}
              />
              <h3 className='text-base font-semibold'>Inbox</h3>
            </div>
            <div className='inline-flex gap-1 rounded-full bg-background px-3'>
              <Image
                src={'/general/icons/user-1.svg'}
                width={15}
                height={15}
                alt={'user-1'}
                key={'user-1'}
              />
              <span className='text-xs'>0</span>
            </div>
          </div>
          <div className='flex gap-3 pt-5 text-white'>
            {items.map((item) => (
              <button
                onClick={() => setSelectedFilter(item)}
                key={item}
                className={cn(
                  'rounded px-2 py-1 text-sm font-medium capitalize transition-colors duration-300 ease-in-out hover:bg-foreground hover:brightness-125',
                  selectedFilter === item && 'bg-foreground brightness-125',
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </header>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
