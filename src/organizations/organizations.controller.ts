import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgMemberGuard } from '../common/guards/org-member.guard';
import { OrgAdminGuard } from '../common/guards/org-admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly svc: OrganizationsService) {}

  @Post()
  create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.svc.create(dto, user.userId);
  }

  @Get('mine')
  findMine(@CurrentUser() user: { userId: string }) {
    return this.svc.findMine(user.userId);
  }

  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.svc.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @UseGuards(OrgMemberGuard)
  @Get(':orgId/users')
  getMembers(@Param('orgId') orgId: string) {
    return this.svc.getMembers(orgId);
  }

  @UseGuards(OrgMemberGuard, OrgAdminGuard)
  @Post(':orgId/users')
  inviteUser(
    @Param('orgId') orgId: string,
    @Body() dto: InviteUserDto,
  ) {
    return this.svc.inviteUser(orgId, dto);
  }

  @UseGuards(OrgMemberGuard, OrgAdminGuard)
  @Delete(':orgId/users/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeUser(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
  ) {
    return this.svc.removeUser(orgId, userId);
  }
}
