export const enumDefs = `#graphql
  enum StageFormatEnum {
    SINGLE_ELIMINATION
    DOUBLE_ELIMINATION
    ROUND_ROBIN
    SWISS_SYSTEM
    LADDER_SYSTEM
  }

  enum CompetitorStructureEnum {
    INDIVIDUAL
    COUPLE
    TEAM
  }

  enum CompetitionFormatEnum {
    SOLO
    HEAD_TO_HEAD
    MULTI_COMPETITOR
  }

  enum DisciplineEnum {
    BASKETBALL
    SOCCER
    TRACK_AND_FIELD
    SWIMMING
    TENNIS
    VOLLEYBALL
    # Add more later
  }

  enum GenderEnum {
    MALE
    FEMALE
  }

  enum StageResultTypeEnum {
    DISTANCE
    FAULT
    IRM
    IRM_POINTS
    IRM_RANK
    IRM_TIME
    NO_SCORE
    PERCENT
    POINTS
    RANK
    RM
    SCORE
    SETS
    STROKES
    TIME
    WEIGHT
  }

  enum CoachRoleEnum {
    HEAD_COACH
    ASSISTANT_COACH
    SECOND_ASSISTANT_COACH
    GOALKEEPER_COACH
  }

  enum OfficialRoleEnum {
    REFEREE
    JUDGE
    MEDICAL_DELEGATE
    JURY_CHAIR
    JURY_MEMBER
    CHALLENGE_REFEREE
    UMPIRE
    HEAD_JUDGE
    TECHNICAL_OFFICIAL
    LINE_JUDGE
  }

  enum CountryEnum {
    ALBANIA
    # Add more later
  }
`;
