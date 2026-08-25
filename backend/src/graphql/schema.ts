export const typeDefs = `#graphql
  type User @node {
    id: ID! @id
    name: String!
    email: String!
  }
`;
