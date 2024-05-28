import { zodResolver } from '@hookform/resolvers/zod';
import { DialogClose } from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

import { createChannel } from '@/actions/channel';
import { Button } from '@/components/ui/button';
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
} from '@/components/ui/form';
import ChannelTypeItem from './channel-type';
import { Input } from '@/components/ui/input';
import { CreateChannelSchemaType, createChannelSchema } from '@/validations';
import { createError } from '@/utils/error';
import { useCallback } from 'react';

export default function CreateChannelForm({
	serverId,
	type,
	serverAuthor,
}: {
	serverId: string;
	type: string;
	serverAuthor: string;
}) {
	const { userId } = useAuth();
	
	const form = useForm<CreateChannelSchemaType>({
		resolver: zodResolver(createChannelSchema),
		defaultValues: {
			channelType: type as CreateChannelSchemaType['channelType'],
			name: '',
		},
	});

	const onSubmit = useCallback(
		async (data: CreateChannelSchemaType) => {
			const { channelType, name } = data;
			const joinedName = name.split(' ').join('-');
			if (!userId) return;

			try {
				await createChannel(
					joinedName,
					serverId,
					channelType,
					'/server/' + serverId,
					userId,
					serverAuthor
				);
				form.resetField('name');
				toast.success('New channel has been created');
			} catch (error) {
				createError(error);
			}
		},
		[userId, serverId, serverAuthor, form]
	);

	const { isValid, isSubmitting } = form.formState;

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<FormField
					control={form.control}
					name='channelType'
					render={({ field }) => (
						<FormItem>
							<ChannelTypeItem value={field.value} form={form} />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name='name'
					render={({ field }) => (
						<FormItem className='mt-5'>
							<FormLabel className='uppercase text-gray-2'>
								Channel name
							</FormLabel>
							<FormControl>
								<Input
									onClick={(e) => e.stopPropagation()}
									autoComplete='off'
									placeholder='# new-channel'
									className='bg-foreground text-white caret-white ring-offset-background focus:border-none  focus-visible:border-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0'
									required
									{...field}
								/>
							</FormControl>
						</FormItem>
					)}
				/>
				<div className='mt-3 flex items-center justify-end gap-3'>
					<DialogClose
						className='text-white'
						type='button'
						onClick={(e) => e.stopPropagation()}
					>
						Cancel
					</DialogClose>

					<Button
						aria-disabled={!isValid || isSubmitting}
						disabled={!isValid || isSubmitting}
						className='bg-primary text-white'
					>
						Create Channel
					</Button>
				</div>
			</form>
		</Form>
	);
}
