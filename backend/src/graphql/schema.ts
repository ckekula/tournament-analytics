/**
 * Neo4j GraphQL schema.
 *
 * - Composite unique constraint (Activity.name + Activity.tournament) is not
 *   expressible via SDL directives in @neo4j/graphql — enforce via a Cypher
 *   constraint (`CREATE CONSTRAINT ... FOR (a:Activity) REQUIRE (a.name, a.tournament) IS UNIQUE`)
 *   or at the resolver layer.
 * - Regex validations (@Matches in the original entities, e.g. "letters,
 *   numbers, and spaces only") are not enforced by GraphQL SDL itself.
 *   Enforce these at the API layer (e.g. via a validation middleware/plugin,
 *   or a library like graphql-constraint-directive).
 */

export const typeDefs = `#graphql
  scalar JSON

  enum FormatEnum {
    SINGLE_ELIMINATION
    DOUBLE_ELIMINATION
    ROUND_ROBIN
    SWISS_SYSTEM
    LADDER_SYSTEM
  }

  enum EventTypeEnum {
    INDIVIDUAL
    TEAM
  }

  enum RoundTypeEnum {
    SOLO
    HEAD_TO_HEAD
    MULTI_COMPETITOR
  }

  enum ParticipantTypeEnum {
    INDIVIDUAL
    TEAM
  }

  enum ActivityEnum {
    BASKETBALL
    SOCCER
  }

  type User @node {
    id: ID! @id
    firstname: String!
    lastname: String!
    email: String! @unique
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
    owner: User! @relationship(type: "OWNS", direction: IN)
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
    organizer: Organization! @relationship(type: "ORGANIZES", direction: IN)
    registeredOrganizations: [Organization!]! @relationship(type: "REGISTERED_IN", direction: IN)
    activities: [Activity!]! @relationship(type: "HAS_ACTIVITY", direction: OUT)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  # Note: composite uniqueness on (name, tournament) from the source
  # @Unique(['name', 'tournament']) must be enforced via a Cypher node key
  # constraint or at the resolver layer.
  type Activity @node {
    id: ID! @id
    name: String!
    tournament: Tournament! @relationship(type: "HAS_ACTIVITY", direction: IN)
    events: [Event!]! @relationship(type: "HAS_EVENT", direction: OUT)
    categories: [Category!]! @relationship(type: "HAS_CATEGORY", direction: OUT)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type Category @node {
    id: ID! @id
    name: String!
    activity: Activity! @relationship(type: "HAS_CATEGORY", direction: IN)
    events: [Event!]! @relationship(type: "IN_CATEGORY", direction: IN)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type Event @node {
    id: ID! @id
    name: String!
    type: EventTypeEnum
    maxTeamsPerOrg: Int
    activity: Activity! @relationship(type: "HAS_EVENT", direction: IN)
    stages: [Stage!]! @relationship(type: "HAS_STAGE", direction: OUT)
    participants: [Participant!]! @relationship(type: "PARTICIPATES_IN", direction: IN)
    categories: [Category!]! @relationship(type: "IN_CATEGORY", direction: OUT)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type Stage @node {
    id: ID! @id
    name: String!
    format: FormatEnum!
    order: Int
    roundType: RoundTypeEnum!
    event: Event! @relationship(type: "HAS_STAGE", direction: IN)
    rounds: [Round!]! @relationship(type: "HAS_ROUND", direction: OUT)
    groupStage: GroupStage @relationship(type: "HAS_GROUP_STAGE", direction: OUT)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type Round @node {
    id: ID! @id
    name: String!
    isGroupRound: Boolean!
    stage: Stage! @relationship(type: "HAS_ROUND", direction: IN)
    roundParticipants: [RoundParticipant!]! @relationship(type: "HAS_ROUND_PARTICIPANT", direction: OUT)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type RoundParticipant @node {
    id: ID! @id
    performance: Int!
    stats: JSON
    round: Round! @relationship(type: "HAS_ROUND_PARTICIPANT", direction: IN)
    participant: Participant! @relationship(type: "PARTICIPATED_IN", direction: IN)
  }

  type Participant @node {
    id: ID! @id
    type: ParticipantTypeEnum!
    events: [Event!]! @relationship(type: "PARTICIPATES_IN", direction: OUT)
    individual: Individual @relationship(type: "REPRESENTS", direction: IN)
    team: Team @relationship(type: "REPRESENTS", direction: IN)
    roundParticipants: [RoundParticipant!]! @relationship(type: "PARTICIPATED_IN", direction: OUT)
    groupParticipants: [GroupParticipant!]! @relationship(type: "IN_GROUP", direction: OUT)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type Individual @node {
    id: ID! @id
    person: Person! @relationship(type: "IS_PERSON", direction: OUT)
    participant: Participant @relationship(type: "REPRESENTS", direction: OUT)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type Team @node {
    id: ID! @id
    name: String!
    organization: Organization! @relationship(type: "HAS_TEAM", direction: IN)
    members: [TeamMember!]! @relationship(type: "HAS_MEMBER", direction: OUT)
    participant: Participant @relationship(type: "REPRESENTS", direction: OUT)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type TeamMember @node {
    id: ID! @id
    person: Person! @relationship(type: "MEMBER_PERSON", direction: OUT)
    team: Team! @relationship(type: "HAS_MEMBER", direction: IN)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type Person @node {
    id: ID! @id
    name: String!
    organization: Organization! @relationship(type: "HAS_PERSON", direction: IN)
    individualParticipations: [Individual!]! @relationship(type: "IS_PERSON", direction: IN)
    teamMemberships: [TeamMember!]! @relationship(type: "MEMBER_PERSON", direction: IN)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type GroupStage @node {
    id: ID! @id
    stage: Stage! @relationship(type: "HAS_GROUP_STAGE", direction: IN)
    groups: [Group!]! @relationship(type: "HAS_GROUP", direction: OUT)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type Group @node {
    id: ID! @id
    name: String!
    maxParticipantsPerGroup: Int
    groupStage: GroupStage! @relationship(type: "HAS_GROUP", direction: IN)
    groupParticipants: [GroupParticipant!]! @relationship(type: "HAS_GROUP_PARTICIPANT", direction: OUT)
    rounds: [GroupRound!]! @relationship(type: "HAS_GROUP_ROUND", direction: OUT)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type GroupParticipant @node {
    id: ID! @id
    participant: Participant! @relationship(type: "IN_GROUP", direction: IN)
    group: Group! @relationship(type: "HAS_GROUP_PARTICIPANT", direction: IN)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }

  type GroupRound @node {
    id: ID! @id
    group: Group! @relationship(type: "HAS_GROUP_ROUND", direction: IN)
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
  }
`;
