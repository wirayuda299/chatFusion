"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef } from "react";

import { useUserContext } from "@/providers/users";
import SearchForm from "@/components/shared/search-form";
import Inbox from "@/components/shared/inbox";
import ChatForm from "../shared/messages/chat-form";
import { useServerContext } from "@/providers/server";
import ChatItem from "../shared/messages/chat-item";
import useScroll from "@/hooks/useScroll";
import { useSocketContext } from "@/providers/socket-io";

export default function ChatList() {
  const { selectedUser, handleSelectUser } = useUserContext();
  const { setServerStates, serversState } = useServerContext();
	const { states, searchParams  } = useSocketContext();
	const ref = useRef<HTMLUListElement>(null);

	
	const messages = useMemo(() => states.personal_messages, [states.personal_messages])
	useScroll(ref, messages);
	
	if (!searchParams.get("chat")) return null;


  return (
		<div className='size-full'>
			<header className='flex items-center justify-between border-b border-b-foreground p-2'>
				<div className='flex items-center gap-3'>
					<Image
						src={selectedUser?.image || '/icons/discord.svg'}
						width={40}
						height={40}
						alt='user'
						priority
						className='rounded-full object-cover'
					/>
					<h4 className='text-sm font-medium capitalize text-gray-2'>
						{selectedUser?.username}
					</h4>
				</div>
				<div className='hidden gap-4 lg:inline-flex'>
					<SearchForm />
					<Inbox>
						<p>personal notifications</p>
					</Inbox>
				</div>
				<Link href={'/direct-messages'} className='md:hidden'>
					Back
				</Link>
			</header>
			<div className='flex h-[calc(100vh-50px)] flex-col justify-end'>
				<ul className='h-dvh space-y-5 p-3 md:h-screen' ref={ref}>
					{
							messages.map(message => (
								<ChatItem
									serversState={serversState}
									setServerStates={setServerStates}
									isCurrentUserBanned={false}
									permissions={undefined}
									replyType='personal'
									key={message.created_at}
									messages={states.personal_messages}
									msg={message}
								/>

							))
					}
				</ul>
				<ChatForm
					type='personal'
					handleSelectUser={handleSelectUser}
					setServerStates={setServerStates}
					placeholder='Message'
					serverStates={serversState}
				/>
			</div>
		</div>
	);
}
