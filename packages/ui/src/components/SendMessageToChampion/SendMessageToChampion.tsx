/* eslint-disable camelcase */
import { gql, useMutation } from "@apollo/client";
import { UserContext } from "@eden/package-context";
import {
  Maybe,
  Members,
  MutationAddNewChatArgs,
  Project,
  RoleType,
} from "@eden/package-graphql/generated";
import {
  Avatar,
  Button,
  Loading,
  TextArea,
  TextHeading3,
} from "@eden/package-ui";
import { useContext, useState } from "react";
import { toast } from "react-toastify";

import {
  AutoArchiveDuration,
  CreateMessageApiRequestBody,
  CreateThreadApiRequestBody,
  CreateThreadResponse,
} from "../../../types/type";

const ADD_NEW_CHAT = gql`
  mutation AddNewChat($fields: addNewChatInput) {
    addNewChat(fields: $fields) {
      _id
    }
  }
`;

const SET_APPLY_TO_PROJECT = gql`
  mutation ($fields: changeTeamMember_Phase_ProjectInput!) {
    changeTeamMember_Phase_Project(fields: $fields) {
      _id
    }
  }
`;

export interface ISendMessageToChampionProps {
  member: Maybe<Members>;
  project?: Project;
  role?: RoleType;
}

export const SendMessageToChampion = ({
  member,
  project,
  role,
}: ISendMessageToChampionProps) => {
  // console.log("project", project);
  // console.log("role", role);
  // console.log("member", member);

  const { currentUser } = useContext(UserContext);
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isMessageSent, setIsMessageSent] = useState(false);

  const [addNewChat] = useMutation<any, MutationAddNewChatArgs>(ADD_NEW_CHAT);

  const [changeTeamMember_Phase_Project, {}] = useMutation(
    SET_APPLY_TO_PROJECT,
    {
      onCompleted: () => {
        toast.success("success");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }
  );

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

  const embededMessage = `
    Project: ${project?.title}
    Description: ${project?.description}
    Role: ${role?.title}
  `;

  const createMessage = async (body: CreateMessageApiRequestBody) => {
    const response = await fetch(encodeURI("/api/discord/createMessage"), {
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

  const followUpMessage = `
    Message:
    
    ${message}

    please check out my profile on Eden
    https://eden-alpha-develop.vercel.app/profile/${currentUser?.discordName}
  `;

  const handleSendMessage = async () => {
    // setSendingMessage(true);
    const { threadId } = await createThread({
      message: `<@${member?._id}> <@${currentUser?._id}>`,
      embedMessage: embededMessage,
      senderAvatarURL: currentUser?.discordAvatar!,
      senderName: `${currentUser?.discordName} - is interested in ${project?.title}`,
      channelId: "1001547443135058010",
      threadName: `${project?.title}, has a new message from ${currentUser?.discordName}`,
      autoArchiveDuration: AutoArchiveDuration.OneDay,
    });

    try {
      await createMessage({
        message: followUpMessage,
        channelId: "1001547443135058010",
        thread: threadId,
      });
    } catch (error) {
      console.log(error);
    }

    try {
      await addNewChat({
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
    } catch (error) {
      console.log(error);
    } finally {
      setSendingMessage(false);
      setIsMessageSent(true);
      if (project?._id && member?._id && role?._id) {
        changeTeamMember_Phase_Project({
          variables: {
            fields: {
              projectID: project?._id,
              memberID: member?._id,
              roleID: role?._id,
              phase: "engaged",
            },
          },
        });
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  if (!member) return null;

  return (
    <div className={`h-80`}>
      {isMessageSent ? (
        <div className={`flex flex-col items-center justify-center`}>
          <TextHeading3 className={`mt-24`}>
            Message sent successfully!
          </TextHeading3>
        </div>
      ) : (
        <>
          {sendingMessage ? (
            <Loading title={`sending message...`} />
          ) : (
            <>
              <div className="rounded-xl border border-gray-300 py-4 px-3">
                <TextHeading3 className={`mr-4`}>
                  Send message to @{member?.discordName} about the {role?.title}{" "}
                  Role
                </TextHeading3>
                <div className="flex items-center ">
                  <Avatar
                    src={currentUser?.discordAvatar || ""}
                    alt={currentUser?.discordName || ""}
                    size={`sm`}
                  />
                  <TextHeading3 className="ml-3">
                    @{currentUser?.discordName}
                    <span className="pl-1 text-sm text-gray-400">
                      #{currentUser?.discriminator}
                    </span>
                  </TextHeading3>
                </div>
                <div className="mt-3">
                  {/* <TextHeading3>Hey, @{member?.discordName}!</TextHeading3> */}
                  <TextArea
                    rows={6}
                    value={message}
                    className="border-none px-0"
                    placeholder="Start typing here"
                    customStyle={{ boxShadow: "none", fontSize: "20px" }}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-3 text-center">
                <div className="inline-block">
                  <Button
                    disabled={message.length === 0}
                    variant="primary"
                    onClick={() => {
                      handleSendMessage();
                    }}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
