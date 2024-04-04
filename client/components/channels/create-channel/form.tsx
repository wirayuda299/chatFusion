import { zodResolver } from '@hookform/resolvers/zod';
import { DialogClose } from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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
import { KeyedMutator } from 'swr';

const schema = z.object({
	channelType: z.enum(['text', 'audio']),
	name: z.string().min(4),
});
export default function CreateChannelForm<T>({
	serverId,
	type,
	mutate,
}: {
	serverId: string;
	type: 'text' | 'audio';
	mutate: KeyedMutator<T>;
}) {
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			channelType: type,
			name: '',
		},
	});
	async function onSubmit(data: z.infer<typeof schema>) {
		const { channelType, name } = data;
		const joinedName = name.split(' ').join('-');
		try {
			await createChannel(
				joinedName,
				serverId,
				channelType,
				'/server/' + serverId
			);
			// @ts-ignore
			mutate('server/' + serverId);
			form.resetField('name');
			toast.success('New channel has been created');
		} catch (error) {
			if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error('Unknown error');
			}
		}
	}
	const isValid = form.formState.isValid;
	const isSubmitting = form.formState.isSubmitting;
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
							<FormLabel className='text-gray-1 uppercase'>
								Channel name
							</FormLabel>
							<FormControl>
								<Input
									onClick={(e) => e.stopPropagation()}
									autoComplete='off'
									placeholder='# new-channel'
									className='bg-[var(--primary)] text-white caret-white ring-offset-[[var(--primary)]] focus:border-none focus:shadow-none focus-visible:border-none focus-visible:ring-0 focus-visible:ring-transparent'
									required
									{...field}
								/>
							</FormControl>
						</FormItem>
					)}
				/>
				<div className='mt-3 flex items-center justify-end gap-3'>
					<DialogClose type='button' onClick={(e) => e.stopPropagation()}>
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
