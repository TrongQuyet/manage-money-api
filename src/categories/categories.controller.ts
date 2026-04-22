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
    @OrgId() orgId: string,
    @Query('type') type?: TransactionType,
  ) {
    return this.svc.findAll(orgId, type);
  }

  @UseGuards(OrgSlugGuard)
  @Get('income')
  findIncome(@OrgId() orgId: string) {
    return this.svc.findAll(orgId, TransactionType.INCOME);
  }

  @UseGuards(OrgSlugGuard)
  @Get('expense')
  findExpense(@OrgId() orgId: string) {
    return this.svc.findAll(orgId, TransactionType.EXPENSE);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Post('seed')
  @HttpCode(HttpStatus.OK)
  seed(@OrgId() orgId: string) {
    return this.svc.seedDefaults(orgId);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Post()
  create(@OrgId() orgId: string, @Body() dto: CreateCategoryDto) {
    return this.svc.create(orgId, dto);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgAdminGuard)
  @Put(':id')
  update(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
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
