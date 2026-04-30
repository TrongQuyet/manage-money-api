import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { Member } from '../entities/member.entity';
import { User } from '../entities/user.entity';
import { OrganizationUser } from '../entities/organization-user.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Member, User, OrganizationUser]), CommonModule],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
