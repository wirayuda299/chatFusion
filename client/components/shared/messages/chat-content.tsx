import { ReactNode, memo, useCallback, useState } from 'react';
import Image from 'next/image';
import type { Socket } from 'socket.io-client';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

import { ServerStates, useServerContext } from '@/providers/server';
import { Message } from '@/types/messages';
const EditMessageForm = dynamic(() => import('./edit-message'), { ssr: false });
const EmojiPickerButton = dynamic(() => import('./emoji-picker'), {
	ssr: false,
});
const MessageMenu = dynamic(() => import('./menu'), { ssr: false });

type Props = {
	userId: string;
	replyType: 'personal' | 'thread' | 'channel' | 'reply';
	styles?: string;
	serverStates: ServerStates;
	message: Message;
	socket: Socket | null;
	handleClick: (e: any) => void;
	children?: ReactNode;
	reloadMessage: () => void;
};

const highlightLinks = (text: string) => {
	const urlRegex = /(https?:\/\/[^\s]+)/g;
	const segments = text.split(urlRegex);
	return segments.map((segment, index) => {
		if (segment.match(urlRegex)) {
			return (
				<a
					key={index}
					href={segment}
					target='_blank'
					className='text-blue-600 hover:border-b hover:border-blue-500'
				>
					{segment}
				</a>
			);
		} else {
			return segment;
		}
	});
};

function ChatContent({
	handleClick,
	serverStates,
	userId,
	socket,
	message,
	children,
	reloadMessage,
	styles,
	replyType,
}: Props) {
	const searchParams = useSearchParams();
	const { setServerStates } = useServerContext();
	const router = useRouter();
	const [formOpen, setFormOpen] = useState<boolean>(false);

	const handleSelectedMessage = useCallback((msg: Message ) => {
			setServerStates((prev) => ({
				...prev,
				selectedMessage: {
					message: msg,
					type: replyType,
					action:'reply'
				}
			}));
		},
		[router, searchParams]
	);

	return (
		<div className='w-full'>
			<div className='group !relative flex items-center'>
				<div>
					<div className='flex flex-wrap gap-x-2 text-white'>
						<div className='flex items-center gap-2'>
							<p className='inline-flex gap-x-1 text-nowrap pt-[2px] text-xs leading-snug text-gray-600'>
								{new Date(message.created_at).toLocaleString('en-US', {
									hour: 'numeric',
									hour12: true,
								})}{' '}
							</p>

							<p
								className='text-sm leading-snug text-gray-2 md:text-sm'
								style={{
									...(message.role && { color: message.role.role_color }),
								}}
							>
								{message.username}
							</p>
						</div>
						{!formOpen && (
							<p
								className='min-w-min text-wrap text-xs text-[#d9dee1] md:text-sm'
								style={{
									wordWrap: 'break-word',
									wordBreak: 'break-all',
								}}
							>
								{highlightLinks(message.message)}
								{new Date(message.update_at).getTime() >
									new Date(message.created_at).getTime() && (
									<span className='pl-1 text-xs text-gray-2'>(edited)</span>
								)}
							</p>
						)}
					</div>
					<div className='ml-9 mt-2 flex flex-wrap gap-2'>
						{(message.reactions || []).map((reaction) => (
							<div
								key={reaction.unified_emoji}
								className='inline-flex w-auto gap-1 rounded-md border border-primary bg-[#373a54] px-2 py-px text-base'
							>
								{reaction.emoji}{' '}
								<span className='font-semibold text-white'>
									{reaction.count}
								</span>
							</div>
						))}
					</div>
				</div>

				<div className='absolute right-0 h-7  rounded bg-background/50 opacity-0 shadow-lg group-hover:opacity-100 sm:right-0 md:brightness-110'>
					<div className='flex size-full min-w-24 items-center gap-4 px-2'>
						<EmojiPickerButton handleClick={handleClick} />
						{message.author === userId && (
							<button
								name='Edit message'
								title='Edit message'
								type='button'
								className='min-w-5'
								onClick={() => setFormOpen((prev) => !prev)}
							>
								<Image
									src={'/icons/pencil.svg'}
									width={20}
									height={20}
									alt='pencil'
								/>
							</button>
						)}
						{children}
						<MessageMenu
							type={replyType}
							styles={styles}
							socket={socket}
							handleSelectedMessage={handleSelectedMessage}
							currentUser={userId}
							channelId={serverStates.selectedChannel?.channel_id!}
							message={message}
							serverId={serverStates.selectedServer?.id!}
						/>
					</div>
				</div>
			</div>
			{formOpen && (
				<EditMessageForm
					reloadMessage={reloadMessage}
					currentUser={userId!}
					messageAuthor={message.author}
					messageId={message.message_id}
					message={message.message}
					handleClose={() => setFormOpen(false)}
				/>
			)}
		</div>
	);
}

export default memo(ChatContent);
