import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
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
import { LogsService } from '../logs/logs.service';

@Controller(':orgSlug/members')
export class MembersController {
  constructor(
    private readonly svc: MembersService,
    private readonly logsService: LogsService,
  ) {}

  @UseGuards(OrgSlugGuard)
  @Get()
  findAll(
    @OrgId() orgId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.svc.findAll(
      orgId,
      page ? Number.parseInt(page) : undefined,
      limit ? Number.parseInt(limit) : undefined,
      search,
    );
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard)
  @Get('self')
  getSelf(
    @OrgId() orgId: number,
    @CurrentUser() user: { userId: number },
  ) {
    return this.svc.findByUserId(orgId, user.userId);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard)
  @Put('self')
  updateSelf(
    @OrgId() orgId: number,
    @CurrentUser() user: { userId: number },
    @Body() dto: UpdateSelfMemberDto,
  ) {
    return this.svc.updateSelf(orgId, user.userId, dto);
  }

  @UseGuards(OrgSlugGuard)
  @Get(':id')
  findOne(@OrgId() orgId: number, @Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(orgId, id);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Post()
  async create(
    @OrgId() orgId: number,
    @Body() dto: CreateMemberDto,
    @CurrentUser() user: { userId: number; username: string },
  ) {
    const member = await this.svc.create(orgId, dto);
    this.logsService.logActivity({
      userId: user.userId,
      userName: user.username,
      action: 'CREATE_MEMBER',
      entityType: 'member',
      entityId: member.id,
      orgId,
      metadata: { name: (member as any).name },
    });
    return member;
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Put(':id')
  async update(
    @OrgId() orgId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: { userId: number; username: string },
  ) {
    const member = await this.svc.update(orgId, id, dto);
    this.logsService.logActivity({
      userId: user.userId,
      userName: user.username,
      action: 'UPDATE_MEMBER',
      entityType: 'member',
      entityId: id,
      orgId,
      metadata: { changes: Object.keys(dto) },
    });
    return member;
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @OrgId() orgId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number; username: string },
  ) {
    await this.svc.remove(orgId, id);
    this.logsService.logActivity({
      userId: user.userId,
      userName: user.username,
      action: 'DELETE_MEMBER',
      entityType: 'member',
      entityId: id,
      orgId,
    });
  }
}
