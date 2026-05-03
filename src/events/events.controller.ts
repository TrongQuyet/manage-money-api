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
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { VoteEventDto } from './dto/vote-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgMemberGuard } from '../common/guards/org-member.guard';
import { OrgAdminGuard } from '../common/guards/org-admin.guard';
import { OrgId } from '../common/decorators/org-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller(':orgSlug/events')
export class EventsController {
  constructor(private readonly svc: EventsService) {}

  @UseGuards(JwtAuthGuard, OrgMemberGuard)
  @Get()
  findAll(
    @OrgId() orgId: number,
    @CurrentUser() user: { userId: number },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.findAll(
      orgId,
      user.userId,
      page ? Number.parseInt(page) : undefined,
      limit ? Number.parseInt(limit) : undefined,
      status,
    );
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard)
  @Get(':id')
  findOne(
    @OrgId() orgId: number,
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.svc.findOne(orgId, id, user.userId);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Post()
  create(
    @OrgId() orgId: number,
    @Body() dto: CreateEventDto,
    @CurrentUser() user: { userId: number; username: string },
  ) {
    return this.svc.create(orgId, dto, user);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Put(':id')
  update(
    @OrgId() orgId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: { userId: number; username: string },
  ) {
    return this.svc.update(orgId, id, dto, user);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @OrgId() orgId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number; username: string },
  ) {
    return this.svc.remove(orgId, id, user);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard)
  @Post(':id/vote')
  vote(
    @OrgId() orgId: number,
    @Param('id', ParseIntPipe) eventId: number,
    @Body() dto: VoteEventDto,
    @CurrentUser() user: { userId: number },
  ) {
    return this.svc.vote(orgId, eventId, user.userId, dto.option);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard)
  @Delete(':id/vote')
  @HttpCode(HttpStatus.OK)
  cancelVote(
    @OrgId() orgId: number,
    @Param('id', ParseIntPipe) eventId: number,
    @CurrentUser() user: { userId: number },
  ) {
    return this.svc.cancelVote(orgId, eventId, user.userId);
  }
}
