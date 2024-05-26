import { Dispatch, SetStateAction, useMemo, useRef } from 'react';

import ChatForm from '@/components/shared/messages/chat-form';
import ChatItem from '@/components/shared/messages/chat-item';
import { ServerStates } from '@/providers/server';
import useScroll from '@/hooks/useScroll';
import usePermissions from '@/hooks/usePermissions';
import { useSocketContext } from '@/providers/socket-io';

export default function ChannelMessages({
	serversState,
	setServerStates,
}: {
	serversState: ServerStates;
	setServerStates: Dispatch<SetStateAction<ServerStates>>;
}) {
	const { states, userId } = useSocketContext();
	const ref = useRef<HTMLUListElement>(null);

	const { isCurrentUserBanned, loading, isError, permissions } = usePermissions(
		userId,
		serversState?.selectedServer?.id || ''
	);

	const messages = useMemo(
		() => states.channel_messages,
		[states.channel_messages]
	);

	useScroll(ref, messages);

	if (loading) return 'loading...';
	if (isError) return <p>error</p>;

	return (
		<div className='flex h-[calc(100vh-120px)] max-w-full flex-col'>
			<ul
				className='ease relative flex h-dvh min-h-full flex-col gap-10 overflow-y-auto p-2 transition-all duration-500 md:h-screen md:p-5'
				ref={ref}
			>
				{messages?.map((message) => (
					<ChatItem
						serversState={serversState}
						setServerStates={setServerStates}
						isCurrentUserBanned={isCurrentUserBanned}
						permissions={permissions}
						replyType='channel'
						key={message.created_at}
						messages={messages}
						msg={message}
					/>
				))}
			</ul>

			{!isCurrentUserBanned ? (
				<ChatForm
					type='channel'
					setServerStates={setServerStates}
					serverStates={serversState}
					placeholder={`Message #${serversState.selectedChannel?.channel_name}`}
				/>
			) : (
				<p className='text-center text-red-600'>You are banned </p>
			)}
		</div>
	);
}
