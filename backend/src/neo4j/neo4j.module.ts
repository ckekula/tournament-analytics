import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import neo4j, { Driver } from 'neo4j-driver';
import { Neo4jService } from './neo4j.service';
import { NEO4J_DRIVER } from './neo4j.constants';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: NEO4J_DRIVER,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Driver => {
        return neo4j.driver(
          config.getOrThrow<string>('NEO4J_URI'),
          neo4j.auth.basic(
            config.getOrThrow<string>('NEO4J_USERNAME'),
            config.getOrThrow<string>('NEO4J_PASSWORD'),
          ),
        );
      },
    },
    Neo4jService,
  ],
  exports: [Neo4jService, NEO4J_DRIVER],
})
export class Neo4jModule {}
