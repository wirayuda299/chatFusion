import Image from 'next/image';
import { useAuth } from '@clerk/nextjs';
import useSWR from 'swr';

import { Button } from '../ui/button';
import { getUserById } from '@/helper/user';
import { useServerContext } from '@/providers/server';

export default function UserAccount() {
	const { setSelectedSetting, setSelectedOption } = useServerContext();
	const { userId } = useAuth();
	const {
		data: user,
		isLoading: userLoading,
		error: userError,
	} = useSWR('user', async () => {
		return getUserById(userId!!);
	});

	const handleClick = () => {
		setSelectedSetting('profiles');
		setSelectedOption('user');
	};

	if (userLoading || userError || !user) return null;

	return (
		<div className='flex size-full max-w-2xl flex-col p-5'>
			<h2 className='py-2 text-lg font-semibold'>My account</h2>
			<div className='min-h-[120px] w-full rounded bg-[#020505]'></div>
			<ul className='bg-[#1E1F22] px-3'>
				<li className='flex items-center justify-between '>
					<div className='flex gap-2'>
						<Image
							className='border-background aspect-auto min-h-[90px] min-w-[90px] -translate-y-3 rounded-full border-4 object-cover'
							src={user.image}
							width={90}
							height={90}
							alt='user'
						/>
						<div className='flex flex-col gap-1'>
							<h3 className='pt-2 text-base font-semibold text-white'>
								{user.username}
							</h3>
							<p className='text-xs '>{user.created_at?.toLocaleString()}</p>
						</div>
					</div>
					<Button onClick={handleClick}>Edit user profile</Button>
				</li>
				<li className='bg-background flex w-full flex-col gap-5 rounded-lg p-3'>
					<div className='flex items-center justify-between'>
						<div>
							<h5 className='text-gray-2 text-sm uppercase leading-relaxed'>
								Display name
							</h5>
							<p className='text-sm text-white'>{user.username}</p>
						</div>
						<Button
							onClick={handleClick}
							className='!bg-[#4e5058] text-sm font-medium text-white'
						>
							Edit
						</Button>
					</div>
					<div className='flex items-center justify-between'>
						<div>
							<h5 className='text-gray-2 text-sm uppercase leading-relaxed'>
								Email
							</h5>
							<p className='text-sm text-white'>{user.email}</p>
						</div>
						<Button
							onClick={handleClick}
							className='!bg-[#4e5058] text-sm font-medium text-white'
						>
							Edit
						</Button>
					</div>
				</li>
				<div className='py-5'>
					<h5 className='text-gray-2 text-sm font-normal'>Account removal</h5>
					<p className='text-gray-2 py-1 text-xs'>
						Disabling your account means you can recover it at any time after
						taking this action.
					</p>
					<Button variant={'destructive'} className='mt-3'>
						Delete account
					</Button>
				</div>
			</ul>
		</div>
	);
}
