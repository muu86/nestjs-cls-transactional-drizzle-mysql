import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { UserRepository } from './user/user.repository';
import { AccountRepository } from './account/account.repository';

@Injectable()
export class AppService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly accountRepository: AccountRepository,
  ) {}

  @Transactional()
  async createUserAndAccount(name: string) {
    const user = await this.userRepository.createUser(name);

    throw new Error('Creating a User should be rollbacked!');

    const account = await this.accountRepository.createAccount(user.id);
  }
}
