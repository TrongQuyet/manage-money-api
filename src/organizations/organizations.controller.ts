import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { OrgUserRole } from '../entities/organization-user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgMemberGuard } from '../common/guards/org-member.guard';
import { OrgAdminGuard } from '../common/guards/org-admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly svc: OrganizationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: { userId: number },
  ) {
    return this.svc.create(dto, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@CurrentUser() user: { userId: number }) {
    return this.svc.findMine(user.userId);
  }

  // Public — không cần đăng nhập
  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.svc.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':orgSlug/my-role')
  getMyRole(
    @Param('orgSlug') orgSlug: string,
    @CurrentUser() user: { userId: number },
  ) {
    return this.svc.getMyRole(orgSlug, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard)
  @Get(':orgId/users')
  getMembers(@Param('orgId', ParseIntPipe) orgId: number) {
    return this.svc.getMembers(orgId);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Post(':orgId/users')
  inviteUser(
    @Param('orgId', ParseIntPipe) orgId: number,
    @Body() dto: InviteUserDto,
  ) {
    return this.svc.inviteUser(orgId, dto);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Put(':orgId/users/:userId/role')
  updateUserRole(
    @Param('orgId', ParseIntPipe) orgId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body('role') role: OrgUserRole,
  ) {
    return this.svc.updateUserRole(orgId, userId, role);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Delete(':orgId/users/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeUser(
    @Param('orgId', ParseIntPipe) orgId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.svc.removeUser(orgId, userId);
  }
}
