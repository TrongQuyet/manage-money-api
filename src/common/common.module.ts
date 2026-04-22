import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationUser } from '../entities/organization-user.entity';
import { Organization } from '../entities/organization.entity';
import { OrgMemberGuard } from './guards/org-member.guard';
import { OrgAdminGuard } from './guards/org-admin.guard';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizationUser, Organization])],
  providers: [OrgMemberGuard, OrgAdminGuard],
  exports: [OrgMemberGuard, OrgAdminGuard, TypeOrmModule],
})
export class CommonModule {}
