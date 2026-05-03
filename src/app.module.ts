import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { MembersModule } from './members/members.module';
import { TransactionsModule } from './transactions/transactions.module';
import { CategoriesModule } from './categories/categories.module';
import { OrgSettingsModule } from './org-settings/org-settings.module';
import { LogsModule } from './logs/logs.module';
import { EventsModule } from './events/events.module';
import { Organization } from './entities/organization.entity';
import { User } from './entities/user.entity';
import { OrganizationUser } from './entities/organization-user.entity';
import { Member } from './entities/member.entity';
import { Transaction } from './entities/transaction.entity';
import { Category } from './entities/category.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { OrgSetting } from './entities/org-setting.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Event } from './entities/event.entity';
import { EventVote } from './entities/event-vote.entity';

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
          OrgSetting,
          ActivityLog,
          AuditLog,
          Event,
          EventVote,
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
    OrgSettingsModule,
    LogsModule,
    EventsModule,
  ],
})
export class AppModule {}
