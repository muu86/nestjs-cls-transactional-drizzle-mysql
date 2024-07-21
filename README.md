# nestjs 에서 transaction propagation 관리

## 개요

`nestjs`에서 `drizzle` orm 사용 중 transaction 전파 기능이 필요해짐.\
`nestjs-cls` 라이브러리에서 트랜잭션 전파 플러그인을 제공(`@nestjs-cls/transactional`).\
하지만, drizzle 용 플러그인은 기본으로 제공하지 않아 `custom adapter`를 만들어야 함.

## nestjs-cls

CLS 란 `Continuation Local Strage` 의 약자.\
`java`는 thread 개념이 있고 `thread local`을 사용해서 특정 thread에서 데이터를 저장하고 접근할 수 있음.\
그러나 `javascript`는 단일 스레드 모델이기 때문에 이벤트 루프에서 실행되는 각 비동기 작업 사이에서 상태를 저장하기 위해서 `nodejs`에서 도입한 것이 `Async Storage`.\
`nestjs-cls`는 nestjs 에서 Async Storage 를 주입하는 라이브러리.\
같은 Request 내에서 Ip 주소라던가, Request Id 등을 Context 전반에 공유하는 것이 쉬워진다.

### @nestjs-cls/transactional

`Async Storage` 내에 같은 `Transaction`을 참조하여 transaction 을 전파할 수 있도록 도와주는 플러그인.\
Spring 의 @Transactional 어노테이션과 비슷하게 사용 가능해서 써봤다.

기본적으로 여러 orm 용(prisma, knex, typeORM 등) 플러그인을 제공하나, `drizzle`은 제공하지 않기 때문에, 직접 Adapter를 구현해야 한다.

## @knaadh/nestjs-drizzle-mysql2 사용

nestjs 에서 drizzle 모듈을 주입해주는 하는 라이브러리.

## 구현

### DI

```typescript
// AppModule 에 DrizzleModule 과 ClsModule 주입
@Module({
  imports: [
    DrizzleMySqlModule.registerAsync({
      tag: DB_TOKEN,
      useClass: DBConfig,
    }),
    ClsModule.forRoot({
      plugins: [
        new ClsPluginTransactional({
          imports: [DrizzleMySqlModule],
          adapter: new NestClsTransactionalDrizzleAdapter(DB_TOKEN, {
            // 현재 transaction options 사용 시 에러 발생
            // isolationLevel: 'repeatable read',
          }),
        }),
      ],
    }),
    UserModule,
    AccountModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}
```

### Adapter

```typescript
// adapter
import { TransactionalAdapter } from '@nestjs-cls/transactional';
import { MySqlTransactionConfig } from 'drizzle-orm/mysql-core';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../../drizzle/schema';

export class NestClsTransactionalDrizzleAdapter
  implements TransactionalAdapter<MySql2Database<typeof schema>, MySql2Database<typeof schema>, MySqlTransactionConfig> {
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
```

## 테스트
```typescript
// UserRepository
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
```

```typescript
// AppService
@Injectable()
export class AppService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly accountRepository: AccountRepository,
  ) {
  }

  @Transactional()
  async createUserAndAccount(name: string) {
    const user = await this.userRepository.createUser(name);

    throw new Error('Creating a User should be rollbacked!');

    const account = await this.accountRepository.createAccount(user.id);
  }
}
```

- create user 가 롤백되어야 함.

```
// 결과
Query: begin
Query: insert into `users` (`id`, `name`) values (default, ?) -- params: ["mjmj"]
Query: rollback
```

## 해결할 것

### transaction options 설정 시 SQL Syntax 에러 발생.

에러 메시지\
You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right
syntax to use near '`set transaction `' at line 1

`sql.join()` 함수가 원인으로 보이고 아래 링크는 해당 이슈 pull request.

아직 정식 버전에 반영이 안 되고 있어서 일단 transaction options 는 사용하지 않기로 함.\
https://github.com/drizzle-team/drizzle-orm/pull/2089/commits/84af90eecda3c26b2714005e5df329d4553ab017

### 직접 `tx.rollback()`을 호출하려면 어떻게?

> It is important to note that the tx property of TransactionHost must work both inside and outside of a transactional context. Therefore it should not have any methods that are specific to a transactional context, because they would be unavailable outside of it (and cause runtime errors).

`TransactionHost<?>` 타입을 생성자 함수에서 주입받는데 Transaction 전파가 활성화된 상태에서는 Transaction 용 DB Instance를 받고,
Transaction 전파 상태가 아니면 `getFallbackInstance` 함수에서 리턴 받은 일반 DB Instance를 주입 받음.

#### drizzle 의 경우 트랜잭션 용 Instance와 일반 Instance 타입이 다름
```typescript
export declare abstract class MySqlTransaction<TQueryResult extends MySqlQueryResultHKT, TPreparedQueryHKT extends PreparedQueryHKTBase, TFullSchema extends Record<string, unknown> = Record<string, never>, TSchema extends TablesRelationalConfig = Record<string, never>> extends MySqlDatabase<TQueryResult, TPreparedQueryHKT, TFullSchema, TSchema> {
  protected schema: RelationalSchemaConfig<TSchema> | undefined;
  protected readonly nestedIndex: number;
  static readonly [entityKind]: string;
  constructor(dialect: MySqlDialect, session: MySqlSession, schema: RelationalSchemaConfig<TSchema> | undefined, nestedIndex: number, mode: Mode);
  rollback(): never;
  /** Nested transactions (aka savepoints) only work with InnoDB engine. */
  abstract transaction<T>(transaction: (tx: MySqlTransaction<TQueryResult, TPreparedQueryHKT, TFullSchema, TSchema>) => Promise<T>): Promise<T>;
}
```

transaction 용 인스턴스에는 `rollback`메서드가 추가되어 있음.\
fallback 용 일반 인스턴스와 transaction 인스턴스 타입이 다름.\
`nestjs-cls` 공식 문서에 따르면 두 인스턴스의 타입이 달라서는 안 되므로 fallback용 인스턴스 타입에 맞춰서 transaction 인스턴스 타입을 설정해야 함.\
drizzle transaction 용 인스턴스는 `MySqlTransaction`타입으로 `MySqlDatabase` 클래스를 상속받기 때문에 문제없으나 `MySqlTransaction`이 가지는 `rollback`메서드를 코드에서 호출할 수 없는게 문제.

