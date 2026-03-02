import Image from "next/image";
import { Pencil, Trash } from "lucide-react";
import { FormEvent, useCallback, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import type { Socket } from "socket.io-client";

import { AllThread, deleteThread, updateThread } from "@/helper/threads";
import { getCreatedDate } from "@/utils/date";
import { Input } from "@/components/ui/input";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Thread } from "@/types/messages";

type Props = {
  socket: Socket | null,
  thread: AllThread,
  serverId: string,
  channelId: string
  reset: () => void
  selectedThread: Thread | null
}

export default function ThreadItem({ thread, serverId, channelId, socket, selectedThread, reset }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const { userId } = useAuth()
  const threadNameRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reloadMessage = useCallback(() => {
    socket?.emit('get-channel-message', {
      serverId,
      channelId
    })
  }, [channelId, serverId, socket])

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault()
    if (!threadNameRef.current) return

    await updateThread(serverId, userId!, thread.thread_id, threadNameRef.current.value, pathname)
    setIsOpen(false)
    reloadMessage()
  }

  const handleDelete = async () => {
    setIsSubmitting(true)
    await deleteThread(thread.thread_id, userId!, reloadMessage, pathname, serverId)
      .then(() => {
        setIsOpen(false)
        if (selectedThread) {
          reset()
        }
      })
    setIsSubmitting(false)

  }

  return (
    <>
      {isOpen ? (
        <form onSubmit={handleUpdate}>
          <Input
            className='w-full rounded bg-background/50 p-2 placeholder:text-xs focus:border-none focus-visible:ring-0 text-gray-2 focus-visible:outline-none md:bg-background'
            type="text"
            defaultValue={thread.thread_name}
            placeholder="thread name"
            ref={threadNameRef} />
          <div className="flex-center gap-2 py-1">
            <button className="text-red-600  text-xs" type="button" onClick={() => setIsOpen(false)}>Cancel</button>
            <button type="submit" className="text-xs text-blue-500">Submit</button>
          </div>
        </form>
      ) : (

        <div
          className="w-full p-2 hover:bg-foreground/50 md:hover:bg-foreground group"
        >
          <p className='text-sm font-medium text-gray-2'>
            {thread.thread_name}
          </p>
          <div className='flex-center justify-between'>
            <div className='flex-center gap-2 text-gray-2'>
              <Image
                src={thread.avatar}
                width={25}
                height={25}
                alt='avatar'
                className='size-5 rounded-full object-cover'
              />
              <h4 className='text-gray-2'>{thread.username}</h4> &#x2022;
              <span className='text-xs font-semibold text-gray-2'>
                {getCreatedDate(new Date(thread.created_at))}
              </span>

            </div>
            {userId && userId === thread.author && (
              <div className="flex-center gap-2">
                <button onClick={() => setIsOpen(prev => !prev)} className="group-hover:opacity-100 opacity-0">
                  <Pencil size={17} className='text-gray-2' />
                </button>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="group-hover:opacity-100 opacity-0">
                      <Trash size={17} className='text-red-600' />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="border-none bg-black">
                    <DialogHeader>
                      <DialogTitle className="text-center text-white">Are you sure want to delete this thread?</DialogTitle>
                      <DialogDescription className="text-xs text-center">
                        This action will permanently delete this thread and all thread messages including all media.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="w-full flex-center">
                      <DialogClose className="w-full">Cancel</DialogClose>
                      <Button
                        disabled={isSubmitting}
                        onClick={handleDelete}
                        className="!bg-red-600 w-full">
                        Delete

                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

              </div>
            )}
          </div>
        </div>

      )}
    </>
  )
}
