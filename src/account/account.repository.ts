import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { NestClsTransactionalDrizzleAdapter } from '../transaction-adapter/nestcls-transactional-drizzle-adapter';
import { accounts } from '../../drizzle/schema';

@Injectable()
export class AccountRepository {
  constructor(private readonly txHost: TransactionHost<NestClsTransactionalDrizzleAdapter>) {}

  async createAccount(userId: number) {
    const [result] = await this.txHost.tx
      .insert(accounts)
      .values({
        userId,
        name: 'account!',
      })
      .$returningId();

    return result;
  }
}
