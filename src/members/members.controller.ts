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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgMemberGuard } from '../common/guards/org-member.guard';
import { OrgAdminGuard } from '../common/guards/org-admin.guard';
import { OrgId } from '../common/decorators/org-id.decorator';

@UseGuards(JwtAuthGuard, OrgMemberGuard)
@Controller(':orgSlug/members')
export class MembersController {
  constructor(private readonly svc: MembersService) {}

  @Get()
  findAll(@OrgId() orgId: string) {
    return this.svc.findAll(orgId);
  }

  @Get(':id')
  findOne(@OrgId() orgId: string, @Param('id') id: string) {
    return this.svc.findOne(orgId, id);
  }

  @UseGuards(OrgAdminGuard)
  @Post()
  create(@OrgId() orgId: string, @Body() dto: CreateMemberDto) {
    return this.svc.create(orgId, dto);
  }

  @UseGuards(OrgAdminGuard)
  @Put(':id')
  update(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.svc.update(orgId, id, dto);
  }

  @UseGuards(OrgAdminGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@OrgId() orgId: string, @Param('id') id: string) {
    return this.svc.remove(orgId, id);
  }
}
