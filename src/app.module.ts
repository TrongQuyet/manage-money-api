import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { MembersModule } from './members/members.module';
import { TransactionsModule } from './transactions/transactions.module';
import { CategoriesModule } from './categories/categories.module';
import { Organization } from './entities/organization.entity';
import { User } from './entities/user.entity';
import { OrganizationUser } from './entities/organization-user.entity';
import { Member } from './entities/member.entity';
import { Transaction } from './entities/transaction.entity';
import { Category } from './entities/category.entity';
import { RefreshToken } from './entities/refresh-token.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3308),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME', 'manage_money'),
        entities: [
          Organization,
          User,
          OrganizationUser,
          Member,
          Transaction,
          Category,
          RefreshToken,
        ],
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        charset: 'utf8mb4',
        timezone: '+07:00',
      }),
    }),
    AuthModule,
    OrganizationsModule,
    MembersModule,
    TransactionsModule,
    CategoriesModule,
  ],
})
export class AppModule {}
