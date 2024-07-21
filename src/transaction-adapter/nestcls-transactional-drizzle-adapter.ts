import { TransactionalAdapter } from '@nestjs-cls/transactional';
import { MySqlTransactionConfig } from 'drizzle-orm/mysql-core';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../../drizzle/schema';

export class NestClsTransactionalDrizzleAdapter
  implements
    TransactionalAdapter<
      MySql2Database<typeof schema>,
      MySql2Database<typeof schema>,
      MySqlTransactionConfig
    >
{
  // implement the property for the connection token
  connectionToken: any;

  // implement default options feature
  defaultTxOptions?: Partial<MySqlTransactionConfig>;

  constructor(
    connectionToken: any,
    defaultTxOptions?: Partial<MySqlTransactionConfig>,
  ) {
    this.connectionToken = connectionToken;
    this.defaultTxOptions = defaultTxOptions;
  }

  optionsFactory(db: MySql2Database<typeof schema>) {
    return {
      wrapWithTransaction: (
        options: MySqlTransactionConfig,
        fn: (...args: any[]) => Promise<any>,
        setTx: (client: MySql2Database<typeof schema>) => void,
      ) => {
        return db.transaction((tx) => {
          setTx(tx);

          return fn();
        }, options);
      },
      getFallbackInstance: () => db,
    };
  }
}
