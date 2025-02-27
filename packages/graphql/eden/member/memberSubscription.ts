import { gql } from "@apollo/client";

export const MEMBER_SUBSCRIPTION = gql`
  subscription ($fields: findMembersInput) {
    memberUpdated(fields: $fields) {
      _id
      discordAvatar
      discordName
      serverID
      bio
      content {
        interest
        mostProud
        showCaseAbility
      }
      attributes {
        Coordinator
        Director
        Helper
        Inspirer
        Motivator
        Observer
        Reformer
        Supporter
      }
      archiveProjects
      discriminator
      hoursPerWeek
      interest
      timeZone
      projects {
        phase
        champion
        favorite
        info {
          _id
          description
          title
          team {
            phase
          }
        }
      }
      links {
        name
        url
      }
      skills {
        skillInfo {
          _id
          name
        }
      }
      onbording {
        percentage
        signup
      }
      memberRole {
        _id
        title
        description
        skills {
          _id
        }
      }
    }
  }
`;
