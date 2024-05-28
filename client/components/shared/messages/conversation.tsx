'use client';

import Image from 'next/image';
import { X } from 'lucide-react';
import Link from 'next/link';

import { Conversation } from '@/types/messages';
import { useUser } from '@/providers/users';
import { cn } from '@/lib/utils/mergeStyle';

export default function ConversationItem({
	conversation,
	styles,
	innerStyles,
}: {
	conversation: Conversation;
	styles?: string;
	innerStyles?: string;
}) {
	const {setUser} = useUser();

	return (
		<div className='w-full py-3'>
			<div
				onClick={() => {
					setUser({
						created_at: conversation.created_at,
						image: conversation.image,
						user_id: conversation.recipient_id,
						username: conversation.username,
					})
				}
				}
				className={cn(
					'group rounded-md hover:bg-background hover:brightness-105',
					innerStyles
				)}
			>
				<Link
					href={`/direct-messages?chat=${encodeURIComponent(conversation.recipient_id)}&conversationId=${encodeURIComponent(conversation.conversation_id)}&message_type=personal`}
					className='flex w-auto items-center justify-between gap-3 p-1'
				>
					<div className='flex items-center gap-3'>
						<Image
							src={conversation.image}
							width={40}
							height={40}
							alt='user'
							className='size-12 min-w-12 rounded-full object-cover'
						/>
						<h3
							className={cn(
								'text-sm font-semibold capitalize text-gray-2',
								styles
							)}
						>
							{conversation.username}
						</h3>
					</div>
					<button
						title='delete'
						className={cn('opacity-0 group-hover:opacity-100', styles)}
					>
						<X className='text-gray-2' size={18} />
					</button>
				</Link>
			</div>
		</div>
	);
}
