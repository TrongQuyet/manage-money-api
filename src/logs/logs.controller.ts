import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgMemberGuard } from '../common/guards/org-member.guard';
import { OrgAdminGuard } from '../common/guards/org-admin.guard';
import { OrgId } from '../common/decorators/org-id.decorator';

@UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
@Controller(':orgSlug/logs')
export class LogsController {
  constructor(private readonly svc: LogsService) {}

  @Get('activity')
  getActivityLogs(
    @OrgId() orgId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.getActivityLogs(
      orgId,
      page ? Number.parseInt(page) : 1,
      limit ? Number.parseInt(limit) : 20,
    );
  }

  @Get('audit')
  getAuditLogs(
    @OrgId() orgId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.getAuditLogs(
      orgId,
      page ? Number.parseInt(page) : 1,
      limit ? Number.parseInt(limit) : 20,
    );
  }
}
