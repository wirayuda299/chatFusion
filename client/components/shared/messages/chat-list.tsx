"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import { useUserContext } from "@/providers/users";
import SearchForm from "@/components/servers/channels/search-form";
import Inbox from '@/components/servers/channels/inbox';
import ChatForm from "./chat-form";
import { useServerContext } from "@/providers/server";
import ChatItem from "./chat-item";
import { addLabelsToMessages } from "@/utils/messages";
import useSocket from "@/hooks/useSocket";

export default function ChatList() {
  const { userId } = useAuth();
  const { selectedUser, handleSelectUser } = useUserContext();
  const { setServerStates, serversState } = useServerContext();
  const { states, reloadPersonalMessage, socket } = useSocket();
  const searchParams = useSearchParams();

  const messageList = addLabelsToMessages(states.personal_messages);

  if (!searchParams.get("chat")) return null;

  return (
    <div className="size-full">
      <header className="flex items-center justify-between border-b border-b-foreground p-2">
        <div className="flex items-center gap-3">
          <Image
            src={selectedUser?.image || ""}
            width={40}
            height={40}
            alt="user"
            className="rounded-full object-cover"
          />
          <h4 className="text-sm font-medium capitalize text-gray-2">
            {selectedUser?.username}
          </h4>
        </div>
        <div className="hidden gap-4 lg:inline-flex">
          <SearchForm />
          <Inbox>
            <p>personal notifications</p>
          </Inbox>
        </div>
        <Link href={"/direct-messages"} className="md:hidden">
          Back
        </Link>
      </header>
      <div className="flex h-[calc(100vh-50px)] flex-col justify-end overflow-y-auto">
        <ul className="h-full overflow-y-auto p-3">
          {messageList?.map((message) => (
            <ChatItem
              replyType="personal"
              key={message.created_at}
              styles="hidden"
              reloadMessage={reloadPersonalMessage}
              messages={states.personal_messages}
              msg={message}
              socket={socket}
              userId={userId || ""}
              serverStates={serversState}
            />
          ))}
        </ul>
        <ChatForm
          socket={socket}
          reloadMessage={reloadPersonalMessage}
          type="personal"
          handleSelectUser={handleSelectUser}
          setServerStates={setServerStates}
          path={`/direct-messages?chat=${searchParams.get("chat")}`}
          placeholder="Message"
          serverStates={serversState}
        />
      </div>
    </div>
  );
}
