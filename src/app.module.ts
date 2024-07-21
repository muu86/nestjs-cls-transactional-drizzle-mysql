import { Module } from '@nestjs/common';
import { DrizzleMySqlModule } from '@knaadh/nestjs-drizzle-mysql2';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DBConfig } from './config/db-config';
import { DB_TOKEN } from './config/constant';
import { NestClsTransactionalDrizzleAdapter } from './transaction-adapter/nestcls-transactional-drizzle-adapter';
import { UserModule } from './user/user.module';
import { AccountModule } from './account/account.module';

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
          adapter: new NestClsTransactionalDrizzleAdapter(DB_TOKEN),
        }),
      ],
    }),
    UserModule,
    AccountModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
