'use client';

import Image from 'next/image';
import { ChevronDown, Plus } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Servers } from '@/types/server';
import ServerInvitationModal from '../invite-modal';
import CreateChannelDialog from '../channels/create-channel/dialog';
import { usePermissionsContext } from '@/providers/permissions';
import ServerSettingsDesktop from '../settings/desktop';
import UserSettingsDesktop from '@/components/user/settings';
import useWindowResize from '@/hooks/useWindowResize';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DialogHeader,
  DialogClose
} from '@/components/ui/dialog';
import Roles from '../settings/roles/roles';
import { Button } from '@/components/ui/button';
import { leaveServer } from '@/helper/server';
import { Categories } from '@/types/channels';

type Props = { server: Servers, categories: Categories[] }

export default function ServersMenuDesktop({ server, categories }: Props) {
  const { permission, errors, loading, userId } = usePermissionsContext();
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(false)

  const channels = useMemo(() => categories.filter(channel => channel.channel_type === 'text').map(c => c.channel_id).flat(), [categories])

  const { windowWidth } = useWindowResize();
  if (windowWidth < 768) return null;

  if (loading)
    return (
      <div className='h-12 w-full animate-pulse rounded-md bg-foreground brightness-110'></div>
    );

  if (errors) return <p>{errors.message}</p>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        name='menu'
        aria-label='menu'
        title='menu'
        className='z-10 hidden w-full items-center justify-between border-b border-b-background !bg-transparent p-3 text-white backdrop-blur-sm md:flex'
      >
        <span className='truncate'>{server.name || 'Server name'}</span>
        <ChevronDown size={18} className='text-gray-1' />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-full min-w-[250px] space-y-1 px-2 !border-none bg-[#111214]'>
        <DropdownMenuItem className='flex items-center text-sm justify-between !text-gray-2 hover:!bg-primary hover:!text-white'>
          <p>Server boost</p>
          <Image
            src={'/server/icons/boost.svg'}
            width={20}
            height={20}
            alt='boost'
          />
        </DropdownMenuItem>
        <DropdownMenuSeparator className='border-b border-b-background' />
        <ServerInvitationModal
          serverAuthor={server.owner_id}
          currentUser={userId!}
          serverId={server.id}
          inviteCode={server.invite_code}
          serverName={server.name}
        >
          <DropdownMenuItem className='flex items-center justify-between !text-primary/80 hover:!bg-primary hover:!text-white text-sm'>
            <p>Invite user</p>
            <Image
              src={'/server/icons/user-plus.svg'}
              width={20}
              height={20}
              alt='invite user'
            />
          </DropdownMenuItem>
        </ServerInvitationModal>
        {userId && server.owner_id === userId && (
          <ServerSettingsDesktop server={server} />
        )}

        {(userId && server.owner_id === userId) ||
          (permission && permission.manage_channel) ? (
          <CreateChannelDialog
            serverAuthor={server.owner_id}
            serverId={server.id}
            type={'text'}
          >
            <div className='group text-sm flex cursor-pointer items-center justify-between rounded px-2 py-2  !text-gray-2 hover:!bg-primary hover:!text-white'>
              Create channel
              <div className='flex size-[18px] items-center justify-center rounded-full bg-[#b5bac1] group-hover:bg-white'>
                <Plus size={20} className='text-gray-1' />
              </div>
            </div>
          </CreateChannelDialog>
        ) : null}

        {(userId && server.owner_id === userId) ||
          (permission && permission.manage_role) ? (

          <Dialog>
            <DialogTrigger className='flex cursor-pointer items-center justify-between !text-gray-2 hover:!bg-primary hover:!text-white w-full text-sm rounded-sm px-2 py-2 '>
              <p>Create role</p>
              <Image
                src={'/server/icons/guards.svg'}
                width={20}
                height={20}
                alt='guards'
              />
            </DialogTrigger>
            <DialogContent className='w-full p-0 border-none max-h-[500px] h-full overflow-hidden'>
              <Roles serverId={server.id} serverAuthor={server.owner_id} styles='!hidden' permissionContainerStyle='bg-foreground/50' searchFormStyle='bg-foreground/50 py-1.5' uiSize='sm' />
            </DialogContent>
          </Dialog>
        ) : null}

        <UserSettingsDesktop />
        <DropdownMenuSeparator className='border-b border-b-background' />

        {userId && userId !== server.owner_id && (
          <Dialog>
            <DialogTrigger className='group flex items-center justify-between !text-red-600 hover:!bg-red-600 hover:!text-white w-full rounded px-2 py-1 mt-1 text-sm'>
              <p>Leave server</p>
              <Image
                className='group-hover:brightness-0 group-hover:invert'
                src={'/server/icons/leave.svg'}
                width={20}
                height={20}
                alt='leave server'
              />

            </DialogTrigger>
            <DialogContent className='bg-black border-none'>
              <DialogHeader className='justify-center items-center'>
                <DialogTitle className='text-white'>Are you sure want to leave this server?</DialogTitle>
                <DialogDescription>
                  You will lost all your roles, permission and messages in this server.
                </DialogDescription>

              </DialogHeader>
              <div className='flex-center justify-between mt-5'>
                <DialogClose className='w-full'>
                  Cancel
                </DialogClose>
                <Button
                  disabled={isLoading}
                  onClick={async () => {
                    setIsLoading(true)
                    await leaveServer(userId, server.id, channels, params?.channel_id as string).then(() => {
                      toast.success('Successfully leave server')
                      router.push('/direct-messages')
                    })
                    setIsLoading(false)
                  }
                  }
                  className='w-full !bg-red-600'>
                  Leave
                </Button>
              </div>
            </DialogContent>
          </Dialog>

        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
