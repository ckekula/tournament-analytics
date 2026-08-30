import { mergeTypeDefs } from '@graphql-tools/merge';
import { enumDefs } from './enums';

const typeDefs = mergeTypeDefs([
  enumDefs,
  `#graphql
  scalar JSON

  type User @node {
    id: ID! @id
    firstname: String!
    lastname: String!
    email: String!
    # exposed as a plain field. In production, restrict it with @authorization
    password: String!
    roles: [String!]!
    ownedOrganizations: [Organization!]! @relationship(type: "OWNS", direction: OUT)
    adminOrganizations: [Organization!]! @relationship(type: "ADMINISTERS", direction: OUT)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type Organization @node {
    id: ID! @id
    slug: String!
    name: String!
    displayName: String
    owner: User @relationship(type: "OWNS", direction: IN)
    admins: [User!]! @relationship(type: "ADMINISTERS", direction: IN)
    organizedTournaments: [Tournament!]! @relationship(type: "ORGANIZES", direction: OUT)
    registeredTournaments: [Tournament!]! @relationship(type: "REGISTERED_IN", direction: OUT)
    teams: [Team!]! @relationship(type: "HAS_TEAM", direction: OUT)
    persons: [Person!]! @relationship(type: "HAS_PERSON", direction: OUT)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type Tournament @node {
    id: ID! @id
    slug: String!
    name: String!
    season: String!
    maxOrgs: Int
    organizer: Organization @relationship(type: "ORGANIZES", direction: IN)
    registeredOrganizations: [Organization!]! @relationship(type: "REGISTERED_IN", direction: IN)
    disciplines: [Discipline!]! @relationship(type: "HAS_DISCIPLINE", direction: OUT)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type Discipline @node {
    id: ID! @id
    name: DisciplineEnum!
    tournament: Tournament @relationship(type: "HAS_DISCIPLINE", direction: IN)
    events: [Event!]! @relationship(type: "HAS_EVENT", direction: OUT)
    categories: [Category!]! @relationship(type: "HAS_CATEGORY", direction: OUT)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type Category @node {
    id: ID! @id
    name: String!
    discipline: Discipline @relationship(type: "HAS_CATEGORY", direction: IN)
    events: [Event!]! @relationship(type: "IN_CATEGORY", direction: IN)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type Event @node {
    id: ID! @id
    name: String!
    competitorStructure: CompetitorStructureEnum!
    competitionFormat: CompetitionFormatEnum!
    maxParticipantsPerOrg: Int
    discipline: Discipline @relationship(type: "HAS_EVENT", direction: IN)
    stages: [Stage!]! @relationship(type: "HAS_STAGE", direction: OUT)
    # Many side of the single Participant.event relationship below.
    # Nested "connect" for a Participant must happen from THIS side
    # (or on Participant create), since single relationship fields
    # don't support nested connect.
    participants: [Participant!]! @relationship(type: "PARTICIPATES_IN", direction: IN)
    categories: [Category!]! @relationship(type: "IN_CATEGORY", direction: OUT)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type Stage @node {
    id: ID! @id
    name: String!
    format: StageFormatEnum!
    order: Int
    resultType: StageResultTypeEnum!
    event: Event @relationship(type: "HAS_STAGE", direction: IN)
    rounds: [Round!]! @relationship(type: "HAS_ROUND", direction: OUT)
    groups: [Group!]! @relationship(type: "HAS_GROUP", direction: OUT)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type Round @node {
    id: ID! @id
    name: String!
    startDateTime: DateTime
    endDateTime: DateTime
    location: Location @relationship(type: "IN_LOCATION", direction: OUT)
    stage: Stage @relationship(type: "HAS_ROUND", direction: IN)
    group: Group @relationship(type: "IN_GROUP", direction: OUT)
    roundParticipants: [RoundParticipant!]! @relationship(type: "HAS_ROUND_PARTICIPANT", direction: OUT)
    officials: [Official!]! @relationship(type: "HAS_OFFICIAL", direction: OUT)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type Participant @node {
    id: ID! @id
    # Single relationship: a Participant is a
    # registration scoped to exactly one Event. A competitor entering
    # multiple events (e.g. 100m and 200m) gets a separate Participant
    # node per event, not one Participant linked to many Events.

    # Neo4j has no relationship-cardinality constraints, so this is not
    # enforced at the database level - nothing stops a second EVENT
    # relationship being created on the same node. The service
    # layer must guard against connecting more than one Event to a given
    # Participant, otherwise reads become non-deterministic.
    event: Event @relationship(type: "PARTICIPATES_IN", direction: OUT)
    person: Person @relationship(type: "REPRESENTS", direction: IN)
    couple: Couple @relationship(type: "REPRESENTS", direction: IN)
    team: Team @relationship(type: "REPRESENTS", direction: IN)
    roundParticipants: [RoundParticipant!]! @relationship(type: "PARTICIPATED_IN", direction: OUT)
    coaches: [Coach!]! @relationship(type: "HAS_COACH", direction: OUT)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type RoundParticipant @node {
    id: ID! @id
    result: Float
    label: String
    stats: JSON # Neo4j stores this as a string. Need APOC JSON parsing at query time
    round: Round @relationship(type: "HAS_ROUND_PARTICIPANT", direction: IN)
    participant: Participant @relationship(type: "PARTICIPATED_IN", direction: IN)
    # Forward-only bracket advancement. Multiple targets support branching paths
    # (winner -> final, loser -> bronze-final).
    advancesTo: [RoundParticipant!]! @relationship(type: "ADVANCES_TO", direction: OUT)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type Couple @node {
    id: ID! @id
    members: [CoupleMember!]! @relationship(type: "HAS_MEMBER", direction: OUT)
    participant: Participant @relationship(type: "REPRESENTS", direction: OUT)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type CoupleMember @node {
    id: ID! @id
    person: Person @relationship(type: "MEMBER_PERSON", direction: OUT)
    couple: Couple @relationship(type: "HAS_MEMBER", direction: IN)
  }

  type Team @node {
    id: ID! @id
    name: String!
    organization: Organization @relationship(type: "HAS_TEAM", direction: IN)
    members: [TeamMember!]! @relationship(type: "HAS_MEMBER", direction: OUT)
    participant: Participant @relationship(type: "REPRESENTS", direction: OUT)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type TeamMember @node {
    id: ID! @id
    person: Person @relationship(type: "MEMBER_PERSON", direction: OUT)
    team: Team @relationship(type: "HAS_MEMBER", direction: IN)
    position: String
    jerseyNumber: Int
    captain: Boolean
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type Person @node {
    id: ID! @id
    name: String!
    gender: GenderEnum
    height: Float
    weight: Float
    disciplines: [DisciplineEnum!]
    dateOfBirth: DateTime
    nationality: CountryEnum
    bio: String

    organization: Organization @relationship(type: "HAS_PERSON", direction: IN)
    individualParticipations: [Participant!]! @relationship(type: "REPRESENTS", direction: IN)
    teamMemberships: [TeamMember!]! @relationship(type: "MEMBER_PERSON", direction: IN)
    couplePerson1: [Couple!]! @relationship(type: "COUPLE_PERSON1", direction: IN)
    coaches: [Coach!]! @relationship(type: "COACHES", direction: IN)
    officials: [Official!]! @relationship(type: "OFFICIATES", direction: IN)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type Group @node {
    id: ID! @id
    name: String!
    maxParticipantsPerGroup: Int
    stage: Stage @relationship(type: "HAS_GROUP", direction: IN)
    groupParticipants: [Participant!]! @relationship(type: "HAS_GROUP_PARTICIPANT", direction: OUT)
    rounds: [Round!]! @relationship(type: "IN_GROUP", direction: IN)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type Coach @node {
    id: ID! @id
    role: CoachRoleEnum
    person: Person @relationship(type: "COACHES", direction: OUT)
    participant: Participant @relationship(type: "HAS_COACH", direction: IN)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type Official @node {
    id: ID! @id
    role: OfficialRoleEnum
    person: Person @relationship(type: "OFFICIATES", direction: OUT)
    round: Round @relationship(type: "HAS_OFFICIAL", direction: IN)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type Venue @node {
    id: ID! @id
    name: String!
    address: String
    city: String
    state: String
    country: String
    locations: [Location!]! @relationship(type: "HAS_LOCATIONS", direction: OUT)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type Location @node {
    id: ID! @id
    name: String!
    venue: Venue @relationship(type: "HAS_LOCATIONS", direction: IN)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }
  `,
]);

export { typeDefs };
