import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { inviteUser } from "@/actions/server";

type Props = {
  params: { id: string };
  searchParams: { inviteCode: string, channelId:string };
};

export default async function Invite({ params, searchParams }: Props) {
  const user = await currentUser();
  if (user) {
    await inviteUser(
      params.id,
      user.id,
      searchParams.inviteCode,
      searchParams.channelId
    )
      .then(() => {
        redirect(`/server/${params.id}`);
      })
      .catch((e) => {
        if (e.message !== "NEXT_REDIRECT") redirect("/direct-messages");
      });
  }

  return <div></div>;
}
