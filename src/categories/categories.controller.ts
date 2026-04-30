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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { TransactionType } from '../entities/category.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgMemberGuard } from '../common/guards/org-member.guard';
import { OrgAdminGuard } from '../common/guards/org-admin.guard';
import { OrgSlugGuard } from '../common/guards/org-slug.guard';
import { OrgId } from '../common/decorators/org-id.decorator';

@Controller(':orgSlug/categories')
export class CategoriesController {
  constructor(private readonly svc: CategoriesService) {}

  @UseGuards(OrgSlugGuard)
  @Get()
  findAll(
    @OrgId() orgId: number,
    @Query('type') type?: TransactionType,
  ) {
    return this.svc.findAll(orgId, type);
  }

  @UseGuards(OrgSlugGuard)
  @Get('income')
  findIncome(@OrgId() orgId: number) {
    return this.svc.findAll(orgId, TransactionType.INCOME);
  }

  @UseGuards(OrgSlugGuard)
  @Get('expense')
  findExpense(@OrgId() orgId: number) {
    return this.svc.findAll(orgId, TransactionType.EXPENSE);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Post('seed')
  @HttpCode(HttpStatus.OK)
  seed(@OrgId() orgId: number) {
    return this.svc.seedDefaults(orgId);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Post()
  create(@OrgId() orgId: number, @Body() dto: CreateCategoryDto) {
    return this.svc.create(orgId, dto);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Put(':id')
  update(
    @OrgId() orgId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
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
