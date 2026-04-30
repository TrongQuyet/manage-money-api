import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { OrgSettingsService } from './org-settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgMemberGuard } from '../common/guards/org-member.guard';
import { OrgAdminGuard } from '../common/guards/org-admin.guard';
import { OrgSlugGuard } from '../common/guards/org-slug.guard';
import { OrgId } from '../common/decorators/org-id.decorator';

@Controller(':orgSlug/settings')
export class OrgSettingsController {
  constructor(private readonly svc: OrgSettingsService) {}

  @UseGuards(OrgSlugGuard)
  @Get()
  getAll(@OrgId() orgId: number) {
    return this.svc.getAll(orgId);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Put(':key')
  upsert(
    @OrgId() orgId: number,
    @Param('key') key: string,
    @Body('value') value: string,
  ) {
    return this.svc.upsert(orgId, key, value);
  }
}
