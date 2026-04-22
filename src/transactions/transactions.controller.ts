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
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgMemberGuard } from '../common/guards/org-member.guard';
import { OrgAdminGuard } from '../common/guards/org-admin.guard';
import { OrgId } from '../common/decorators/org-id.decorator';

@UseGuards(JwtAuthGuard, OrgMemberGuard)
@Controller(':orgSlug/transactions')
export class TransactionsController {
  constructor(private readonly svc: TransactionsService) {}

  @Get()
  findAll(@OrgId() orgId: string) {
    return this.svc.findAll(orgId);
  }

  @Get('summary')
  getSummary(@OrgId() orgId: string) {
    return this.svc.getSummary(orgId);
  }

  @Get(':id')
  findOne(@OrgId() orgId: string, @Param('id') id: string) {
    return this.svc.findOne(orgId, id);
  }

  @UseGuards(OrgAdminGuard)
  @Post()
  create(@OrgId() orgId: string, @Body() dto: CreateTransactionDto) {
    return this.svc.create(orgId, dto);
  }

  @UseGuards(OrgAdminGuard)
  @Put(':id')
  update(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
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
