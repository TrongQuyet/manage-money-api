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
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgMemberGuard } from '../common/guards/org-member.guard';
import { OrgAdminGuard } from '../common/guards/org-admin.guard';
import { OrgSlugGuard } from '../common/guards/org-slug.guard';
import { OrgId } from '../common/decorators/org-id.decorator';

@Controller(':orgSlug/transactions')
export class TransactionsController {
  constructor(private readonly svc: TransactionsService) {}

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

  @UseGuards(OrgSlugGuard)
  @Get('summary')
  getSummary(@OrgId() orgId: number) {
    return this.svc.getSummary(orgId);
  }

  @UseGuards(OrgSlugGuard)
  @Get(':id')
  findOne(@OrgId() orgId: number, @Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(orgId, id);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Post()
  create(@OrgId() orgId: number, @Body() dto: CreateTransactionDto) {
    return this.svc.create(orgId, dto);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Put(':id')
  update(
    @OrgId() orgId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.svc.update(orgId, id, dto);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@OrgId() orgId: number, @Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(orgId, id);
  }
}
