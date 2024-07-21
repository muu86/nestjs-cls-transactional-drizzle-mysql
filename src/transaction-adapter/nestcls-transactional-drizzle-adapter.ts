import { TransactionalAdapter } from '@nestjs-cls/transactional';
import { MySqlTransactionConfig } from 'drizzle-orm/mysql-core';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../../drizzle/schema';

export class NestClsTransactionalDrizzleAdapter
  implements TransactionalAdapter<MySql2Database<typeof schema>, MySql2Database<typeof schema>, MySqlTransactionConfig>
{
  connectionToken: any;

  defaultTxOptions?: Partial<MySqlTransactionConfig>;

  constructor(connectionToken: any, defaultTxOptions?: Partial<MySqlTransactionConfig>) {
    this.connectionToken = connectionToken;
    this.defaultTxOptions = defaultTxOptions;
  }

  optionsFactory(db: MySql2Database<typeof schema>) {
    return {
      wrapWithTransaction: async (
        options: MySqlTransactionConfig,
        fn: (...args: any[]) => Promise<any>,
        setTx: (client: MySql2Database<typeof schema>) => void,
      ) => {
        return db.transaction(async (tx) => {
          setTx(tx);

          return fn();
        }, options);
      },
      getFallbackInstance: () => db,
    };
  }
}
