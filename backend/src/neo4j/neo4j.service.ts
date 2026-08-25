import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Driver } from 'neo4j-driver';
import { NEO4J_DRIVER } from './neo4j.constants';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(NEO4J_DRIVER)
    private readonly driver: Driver,
  ) {}

  getDriver(): Driver {
    return this.driver;
  }

  async onModuleInit() {
    await this.driver.verifyConnectivity();
  }

  async onModuleDestroy() {
    await this.driver.close();
  }
}
