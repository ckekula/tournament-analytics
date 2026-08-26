import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Neo4jGraphQL } from '@neo4j/graphql';
import { Neo4jModule } from './neo4j/neo4j.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Neo4jService } from './neo4j/neo4j.service';
import { typeDefs } from './graphql/schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    Neo4jModule,

    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [Neo4jModule, ConfigModule],
      inject: [Neo4jService, ConfigService],

      useFactory: async (
        neo4j: Neo4jService,
        config: ConfigService,
      ): Promise<ApolloDriverConfig> => {
        const database = config.getOrThrow<string>('NEO4J_DATABASE');

        const neo4jGraphQL = new Neo4jGraphQL({
          typeDefs,
          driver: neo4j.getDriver(),
        });

        const schema = await neo4jGraphQL.getSchema();

        return {
          schema,
          path: '/graphql',
          context: () => ({
            sessionConfig: { database },
          }),
        };
      },
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
