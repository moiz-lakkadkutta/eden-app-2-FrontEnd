/* eslint-disable no-unused-vars */
import { useMutation, useQuery } from "@apollo/client";
import { UserContext } from "@eden/package-context";
import { ADD_NEW_CHAT, FIND_MEMBER, FIND_MEMBERS } from "@eden/package-graphql";
import {
  Members,
  MutationAddNewChatArgs,
} from "@eden/package-graphql/generated";
import {
  AppUserSubmenuLayout,
  Avatar,
  Button,
  Card,
  GridItemNine,
  GridItemThree,
  GridLayout,
  SendMessageToUserModal,
  SEO,
  TextField,
} from "@eden/package-ui";
import { useContext, useState } from "react";

import type { NextPageWithLayout } from "../_app";

const ChatPage: NextPageWithLayout = (session) => {
  const [selectedMember, setSelectedMember] = useState<Members>();
  const { data: dataMembers } = useQuery(FIND_MEMBERS, {
    variables: {
      fields: {
        _id: null,
      },
    },
    context: { serviceName: "soilservice" },
  });

  const [search, setSearch] = useState("");
  const [findMember, setFindMember] = useState("");
  const { data: dataSearchMember } = useQuery(FIND_MEMBER, {
    variables: {
      fields: {
        discordName: search,
      },
      skip: search === "",
    },
    context: { serviceName: "soilservice" },
  });

  const searchMember = dataSearchMember?.findMember;

  // if (searchMember) console.log(searchMember);
  if (session) console.log(session);

  const { currentUser } = useContext(UserContext);
  const [openModal, setOpenModal] = useState(false);
  const [addNewChat] = useMutation<any, MutationAddNewChatArgs>(ADD_NEW_CHAT);
  const createThread = async (body: CreateThreadApiRequestBody) => {
    const response = await fetch(encodeURI("/api/discord/createThread"), {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const jsonData: CreateThreadResponse = await response.json();

    return jsonData;
  };

  return (
    <>
      <SEO />
      <GridLayout>
        <GridItemThree>
          <Card shadow className="h-85 bg-white p-6">
            <TextField onChange={(e) => setFindMember(e.target.value)} />
            <Button
              className={`my-4`}
              variant="primary"
              onClick={() => setSearch(findMember)}
            >
              Search
            </Button>
            <div>
              {searchMember && (
                <div>
                  <Avatar src={searchMember.discordAvatar} />
                  <p>@{searchMember.discordName}</p>
                  <Button
                    className={`my-4`}
                    variant="primary"
                    onClick={() => {
                      setOpenModal(true);
                      setSelectedMember(searchMember);
                    }}
                  >
                    Send Message
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </GridItemThree>
        <GridItemNine>
          <Card shadow className="h-85 overflow-auto bg-white p-6">
            {dataMembers?.findMembers.map((member: Members) => (
              <div
                key={member._id}
                className="flex items-center justify-between border-b border-gray-200 p-4"
              >
                <div className="flex items-center">
                  <Avatar
                    src={member.discordAvatar as string}
                    alt={member.discordName as string}
                    size="sm"
                  />

                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {member.discordName}
                    </p>
                    <p className="text-sm text-gray-500">Online</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    setOpenModal(true);
                    setSelectedMember(member);
                  }}
                >
                  Message
                </Button>
              </div>
            ))}
          </Card>
          <SendMessageToUserModal
            member={selectedMember as Members}
            openModal={openModal}
            onClose={() => setOpenModal(!openModal)}
            onSubmit={async (message, member) => {
              let threadName = "Project Talents Discussion";

              if (member) {
                threadName = `Project Talents Discussion -- ${member.discordName}`;
              }
              const { threadId } = await createThread({
                message: `<@${member?._id}> <@${currentUser?._id}>`,
                embedMessage: message,
                senderAvatarURL: currentUser?.discordAvatar!,
                senderName: `${currentUser?.discordName} -- Just invite you to a conversation`,
                channelId: "1001547443135058010",
                threadName: `Project Talents Discussion with ${member?.discordName}`,
                autoArchiveDuration: AutoArchiveDuration.OneDay,
              });

              const result = await addNewChat({
                variables: {
                  fields: {
                    message: message,
                    projectID: "62f685952dc2d40004d395c7",
                    receiverID: member?._id!,
                    senderID: currentUser?._id!,
                    serverID: "988301790795685930",
                    threadID: threadId,
                  },
                },
              });

              console.log(result);
              setOpenModal(false);
            }}
          />
        </GridItemNine>
      </GridLayout>
    </>
  );
};

ChatPage.getLayout = (page) => (
  <AppUserSubmenuLayout showSubmenu={false}>{page}</AppUserSubmenuLayout>
);

export default ChatPage;

import { IncomingMessage, ServerResponse } from "http";
import { getSession } from "next-auth/react";

import {
  AutoArchiveDuration,
  CreateThreadApiRequestBody,
  CreateThreadResponse,
} from "../../types/type";

export async function getServerSideProps(ctx: {
  req: IncomingMessage;
  res: ServerResponse;
}) {
  const session = await getSession(ctx);

  const url = ctx.req.url?.replace("/", "");

  if (!session) {
    return {
      redirect: {
        destination: `/login?redirect=${url}`,
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
