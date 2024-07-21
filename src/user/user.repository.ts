import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { NestClsTransactionalDrizzleAdapter } from '../transaction-adapter/nestcls-transactional-drizzle-adapter';
import { users } from '../../drizzle/schema';

@Injectable()
export class UserRepository {
  constructor(private readonly txHost: TransactionHost<NestClsTransactionalDrizzleAdapter>) {}

  async createUser(name: string) {
    const [result] = await this.txHost.tx
      .insert(users)
      .values({
        name,
      })
      .$returningId();

    return result;
  }
}
