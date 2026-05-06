import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LoanRequestsService } from './loan-requests.service';
import { CreateLoanRequestDto } from './dto/create-loan-request.dto';
import { AdminReviewDto } from './dto/admin-review.dto';
import { VoteLoanRequestDto } from './dto/vote-loan-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgMemberGuard } from '../common/guards/org-member.guard';
import { OrgAdminGuard } from '../common/guards/org-admin.guard';
import { OrgId } from '../common/decorators/org-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, OrgMemberGuard)
@Controller(':orgSlug/loan-requests')
export class LoanRequestsController {
  constructor(private readonly svc: LoanRequestsService) {}

  @Post()
  create(
    @OrgId() orgId: number,
    @CurrentUser() user: { userId: number; username: string },
    @Body() dto: CreateLoanRequestDto,
  ) {
    return this.svc.create(orgId, user.userId, user.username, dto);
  }

  @Get()
  findAll(
    @OrgId() orgId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.findAll(orgId, page ? +page : 1, limit ? +limit : 20);
  }

  @Get('transfer-requests')
  @UseGuards(OrgAdminGuard)
  getTransferRequests(
    @OrgId() orgId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.getTransferRequests(orgId, page ? +page : 1, limit ? +limit : 20);
  }

  @Get(':id')
  findOne(@OrgId() orgId: number, @Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(orgId, id);
  }

  @Post(':id/admin-review')
  @UseGuards(OrgAdminGuard)
  adminReview(
    @OrgId() orgId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number; username: string },
    @Body() dto: AdminReviewDto,
  ) {
    return this.svc.adminReview(orgId, id, user.userId, user.username, dto);
  }

  @Post(':id/vote')
  vote(
    @OrgId() orgId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number; username: string },
    @Body() dto: VoteLoanRequestDto,
  ) {
    return this.svc.vote(orgId, id, user.userId, user.username, dto);
  }

  @Post('transfer-requests/:transferId/complete')
  @UseGuards(OrgAdminGuard)
  completeTransfer(
    @OrgId() orgId: number,
    @Param('transferId', ParseIntPipe) transferId: number,
    @CurrentUser() user: { userId: number; username: string },
  ) {
    return this.svc.completeTransfer(orgId, transferId, user.userId, user.username);
  }
}
