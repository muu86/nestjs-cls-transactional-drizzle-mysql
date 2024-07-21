import type { DrizzleMySqlConfig } from '@knaadh/nestjs-drizzle-mysql2/src/mysql.interface';
import * as schema from '../../drizzle/schema';

export class DBConfig {
  create = (): DrizzleMySqlConfig => {
    return {
      mysql: {
        connection: 'client',
        config: {
          host: 'localhost',
          user: 'mj',
          port: 3307,
          password: 'alswp',
          database: 'test',
        },
      },
      config: { schema, mode: 'default', logger: true },
    };
  };
}
