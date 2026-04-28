import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdateSelfMemberDto } from './dto/update-self-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgMemberGuard } from '../common/guards/org-member.guard';
import { OrgAdminGuard } from '../common/guards/org-admin.guard';
import { OrgSlugGuard } from '../common/guards/org-slug.guard';
import { OrgId } from '../common/decorators/org-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller(':orgSlug/members')
export class MembersController {
  constructor(private readonly svc: MembersService) {}

  @UseGuards(OrgSlugGuard)
  @Get()
  findAll(@OrgId() orgId: string) {
    return this.svc.findAll(orgId);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard)
  @Get('self')
  getSelf(
    @OrgId() orgId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.svc.findByUserId(orgId, user.userId);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard)
  @Put('self')
  updateSelf(
    @OrgId() orgId: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateSelfMemberDto,
  ) {
    return this.svc.updateSelf(orgId, user.userId, dto);
  }

  @UseGuards(OrgSlugGuard)
  @Get(':id')
  findOne(@OrgId() orgId: string, @Param('id') id: string) {
    return this.svc.findOne(orgId, id);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Post()
  create(@OrgId() orgId: string, @Body() dto: CreateMemberDto) {
    return this.svc.create(orgId, dto);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Put(':id')
  update(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.svc.update(orgId, id, dto);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@OrgId() orgId: string, @Param('id') id: string) {
    return this.svc.remove(orgId, id);
  }
}
