'use client';

import { MoveLeft } from 'lucide-react';
import { TouchEvent, useState } from 'react';

import ChatForm from '../chat-form';
import { useServerContext } from '@/providers/server';
import { cn } from '@/lib/utils';
import ChanelInfo from '../drawer/channel-info';

export default function SelectedChannel() {
	const { selectedChannel, setSelectedChannel } = useServerContext();
	const [startX, setStartX] = useState<number | null>(null);

	const onTouchStart = (e: TouchEvent) => setStartX(e.touches[0].clientX);

	const onTouchMove = (e: TouchEvent) => {
		if (!startX) return;
		const differences = e.touches[0].clientX - startX;
		if (differences > 50) {
			setSelectedChannel(null);
		}
	};
	const onTouchEnd = () => setStartX(null);

	return (
		<div
			onTouchStart={onTouchStart}
			onTouchMove={onTouchMove}
			onTouchEnd={onTouchEnd}
			className={cn(
				'fixed md:static transition-all ease-out duration-300 top-0 z-40 h-screen w-full overflow-y-auto bg-black md:bg-background border-l-2 border-l-foreground',
				selectedChannel ? 'right-0' : '-right-[calc(100%-20px)] md:hidden'
			)}
		>
			<div className='flex size-full flex-col justify-between'>
				<div>
					<header className='border-b-foreground w-full border-b-2 p-2 '>
						<div className='flex items-center gap-3'>
							<button
								className='md:hidden'
								onClick={() => setSelectedChannel(null)}
							>
								<MoveLeft className='text-gray-2' />
							</button>
							<div className='flex items-center gap-1 '>
								<h3 className='text-md font-semibold lowercase text-white'>
									#{selectedChannel?.channel_name}
								</h3>
								<div className='md:hidden'>
									<ChanelInfo />
								</div>
							</div>
						</div>
					</header>
					<div>chat</div>
				</div>
				<ChatForm
					channelId={selectedChannel?.channel_id as string}
					channelName={selectedChannel?.channel_name as string}
				/>
			</div>
		</div>
	);
}
